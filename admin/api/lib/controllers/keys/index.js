var cfg = require('../../config').get('cube'),
  mongodb = require('mongodb'),
  Db = mongodb.Db,
  Server = mongodb.Server,
  ReadPreference = mongodb.ReadPreference,
  Stream = require('stream'),
  _ = require('underscore'),
  retry = 5000,
  db;

function mongoUrl() {
  var user = cfg["mongo-username"],
      pass = cfg["mongo-password"],
      host = cfg["mongo-host"] || "localhost",
      port = cfg["mongo-port"] || 27017,
      name = cfg["mongo-database"] || "cube",
      auth = user ? user + ":" + pass + "@" : "";
  return "mongodb://" + auth + host + ":" + port + "/" + name;
}

function scheduleNext(func, delay) {
  setTimeout(func, delay)
}

function connect() {
  Db.connect(mongoUrl(), {
    db: {
      safe: true,
      native_parser: true,
      poolSize: 4,
      strict: true
    },
    server: {
      auto_reconnect: true,
      readPreference: ReadPreference.SECONDARY_PREFERRED
    }
  }, function (err, dbHandle) {
    if (err) {
      console.error('Failed to connect, retrying')
      // Retry until we managed to do so.
      return scheduleNext(connect, retry)
    }
    db = dbHandle;
  });
}
connect();

exports.keysForType = function(req, res) {
  if (!db) {
    res.json(500, {
      message: "server not ready"
    })
  }
  db.collection(req.params.type + "_events_keys", function(err, col) {
    if (err) {
      if (err.message === "Collection does-not-exist does not exist. Currently in strict mode.") {
        return res.json([])
      }
      return res.json(500, {
        message: err.message
      })
    }


    var format = new ArrayFormatter;
    res.setHeader('content-type', 'application/json')
    return col.find().stream().pipe(format).pipe(res);
  });
};

var searchExp = /_events_keys$/;

exports.listTypes = function(req, res) {
  if (!db) {
    res.json(500, {
      message: "server not ready"
    })
  }


  db.collections(function(err, collections) {
    var memo = [],
      events = _.reduce(collections, function(memo, col) {

        if (searchExp.test(col.collectionName)) {
          memo.push(col.collectionName.replace(searchExp, ''));
        }
        return memo;
      }, memo)

      res.json({
        results: memo
      });

  });
}

function ArrayFormatter() {
  Stream.call(this);
  this.writable = true;
  this._done = false;
}

ArrayFormatter.prototype.__proto__ = Stream.prototype;

ArrayFormatter.prototype.write = function(doc) {
  if (!this._hasWritten) {
    this._hasWritten = true;

    // open an object literal / array string along with the doc
    this.emit('data', '{ "results": [' + JSON.stringify(doc));

  } else {
    this.emit('data', ',' + JSON.stringify(doc));
  }

  return true;
}

ArrayFormatter.prototype.end = ArrayFormatter.prototype.destroy = function() {
  if (this._done) return;
  this._done = true;
  // close the object literal / array
  if (!this._hasWritten) {
    this.emit('data','{ "results": [');
  }
  this.emit('data', ']}');

  // done
  this.emit('end');
}
