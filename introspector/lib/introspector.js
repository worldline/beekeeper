var async = require('async'),
  mongodb = require('mongodb'),
  cfg = require('./config'),
  Db = mongodb.Db,
  ObjectID = mongodb.ObjectID;

var commands = require('./introspector-commands'),
  enabled;

function mongoUrl() {
  var user = cfg.get("mongo-username"),
      pass = cfg.get("mongo-password"),
      host = cfg.get("mongo-host") || "localhost",
      port = cfg.get("mongo-port") || 27017,
      name = cfg.get("mongo-database") || "cube-events",
      auth = user ? user + ":" + pass + "@" : "";
  return "mongodb://" + auth + host + ":" + port + "/" + name;
}

function mongoOptions() {
  return {
    db: { native_parser: true, safe: true },
    server: { auto_reconnect: true, poolSize: 4 }
  }
}

function start(options) {
  options = options || {};
  enabled = true;

  var db, retry = options.retry || 5000, interval = options.interval || 300000, outDb;

  var filterEvents = (function () {
    var event = /_events$/;
    return function (col) {
      return event.test(col.collectionName);
    };
  })();

  var filterMetrics = (function () {
    var event = /_metrics$/;
    return function (col) {
      return event.test(col.collectionName);
    };
  })();

  function scheduleNext(func, delay) {
    if (enabled) {
      setTimeout(func, delay);
    } else {
      db && db.close();
    }
  }

  function dbConnect (callback) {
    Db.connect(mongoUrl(), mongoOptions(), function (err, dbHandle) {
      if (err) return callback(err);
      db = dbHandle;

      var username = cfg.get('mongo-username'),
          password = cfg.get('mongo-password'),
          targetDb = cfg.get('mongo-target-database');

      if (targetDb) {
        outDb = db.db(targetDb);
      } else {
        outDb = db;
      }

      if (username && password && targetDb) {
        outDb = db.db(targetDb);
        outDb.authenticate(username, password, function(err, result) {
          if (err) return callback(err);
          if (!result) return callback(new Error('Could not connect to the target database.'))
          callback();
        });
      } else {
        callback();
      }
    });
  }

  function connect() {
    dbConnect(function (err) {
      if (err) {
        console.error('Failed to connect, retrying');
        // Retry until we managed to do so.
        return scheduleNext(connect, retry);
      }

      function createKeyCollections(collection, callback) {
        outDb.collection(collection.collectionName + '_keys').ensureIndex({
          value: 1
        }, {
          background: true
        }, callback);
      }

      function mapReduce(collection, callback) {
        var keyCollection = collection.collectionName + '_keys',
          time0 = Date.now(),
          targetDatabase = cfg.get('mongo-target-database') || 'cube';

        outDb.collection(keyCollection).findOne({}, {
          sort: {
            value: -1
          },
          fields: {
            value: 1
          }
        }, function (err, latest) {
          if (err) {
            return callback(err);
          }
          var query = {};
          if (latest) {
            query._id = {
              $gt: ObjectID.createFromTime(latest.value / 1000)
            };
          }
          collection.mapReduce(commands.map, commands.reduce, {
            //jsMode: true, // option removed until mongos supports it
            scope: commands.scope,
            query: query,
            sort: {
              _id: -1
            },
            out: {
              merge: keyCollection,
              db: targetDatabase,
              nonAtomic: true
            }
          }, function (err) {
            if (err) {
              return callback(err);
            }
            console.log('M/R on %s done in %dms', collection.collectionName, Date.now() - time0);
            callback();
          });
        });
      }

      function run() {
        db.collections(function (err, collections) {
          if (err || !collections) {
            if (err) {
              console.error('Error getting collections', err);
            }
            return scheduleNext(run, retry);
          }
          var events = collections.filter(filterEvents),
            metrics = collections.filter(filterMetrics),
            time0 = Date.now();

          async.each(events, createKeyCollections, function (err) {
            if (err) {
              console.error('Error creating keys collections', err.toString());
              return scheduleNext(run, retry);
            }
            async.eachSeries(events, mapReduce, function (err) {
              if (err) {
                console.error('Error during map reduce', err.toString());
                return scheduleNext(run, retry);
              }
              console.log('Introspection done in %dms, next run in %ds', Date.now() - time0, interval / 1000);
              scheduleNext(run, interval);
            });
          });
        });
      }

      // Start our scheduled IMR
      run();
    });
  }

  connect();
}

function stop() {
  enabled = false;
}

module.exports = {
  start: start,
  stop: stop
};
