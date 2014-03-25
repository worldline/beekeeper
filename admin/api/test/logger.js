/*global describe: true, it: true, before: true, after: true, beforeEach: true*/
var mocha     = require('mocha')
  , should    = require('should')
  , Logger    = require('../lib/logger')
  , LogEntry  = require('../lib/models/logentry')
  , cfg       = require('../lib/config')
  , failover  = cfg.get('logs').failover
  , fs        = require('fs')
  , sandbox   = require('sandboxed-module')
  , _         = require('underscore')

describe('A logger', testLogger());
describe('A logger for user Alice', testLogger('alice'));

function testLogger (user) {
  if(typeof user == "undefined")
    user = null;

  return function() {

    // Purge MongoDB
    function purgeTestLogDB(done) {
      var dropDatabase = function () {
        LogEntry.db.db.dropDatabase(done)
      }

      if (LogEntry.db.readyState === 1) { dropDatabase();return; }
      LogEntry.db.on('open', function () { dropDatabase();return; })
    }

    before(purgeTestLogDB)


    function removeLogFile(done) {
      fs.unlink(failover, function () {
        done()
      })
    }
    before(removeLogFile)

    // Initialize our logger
    before(function () {
      if(user) {
        this.logger = (new Logger(module)).user(user)
      } else {
        this.logger = new Logger(module)
      }
    })

    after(removeLogFile)

    after(purgeTestLogDB)

    var levels = ['trace','debug','log', 'info', 'warn', 'error']
    levels.forEach(function (level) {
      describe('with ' + level + ' level', function() {
        before(function (done) {
          this.logger[level](1, 2, 3, 'b')
          setTimeout(done, 200) // Wait a bit to allow mongo to persist
        })

        it('should be able to persist in mongo', function (done) {
          LogEntry.find({ level: level }, function (err, docs) {
            should.not.exist(err)
            docs.should.have.length(1)
            var doc = docs[0].toObject()
            doc.level.should.eql(level)
            doc.data.should.eql(['1', '2', '3', 'b']) //strings are now managed specially and quotes are removed
            doc.file.should.eql(__filename)
            doc.should.have.property('_id')
            done()
          })
        })
      })
    }, this)

    describe('with a dead mongo', function() {
      beforeEach(function () {
        var fakeLog = function(options) {
            var obj = _.extend({
              toObject: function() {
                return obj
              },
              toString: function() {
                return JSON.stringify(obj)
              }
            }, options)

            return obj
          }
          , SandboxedLogger = sandbox.require('../lib/logger', {
            requires: { '../models/logentry': fakeLog }
          })

        fakeLog.collection = {
          insert: function (doc, callback) {
            callback(new Error('Fake Error'))
          }
        }
        if(user) {
          this.logger = (new SandboxedLogger(module)).user(user)
        } else {
          this.logger = new SandboxedLogger(module)
        }

      })

      it('should be able to log to a file', function (done) {
        this.logger.writeStream.once('drain' , function() {
          fs.readFile(failover, 'utf8', function (err, data) {

            should.not.exist(err)

            var res = JSON.parse(data);
            res.should.have.property("level","info")
            res.should.have.property("file",__filename)
            res.should.have.property("user",user)
            res.should.have.property("data").eql(["1","2","3","b"]) //strings are now managed specially and quotes are removed
            done()
          })
        });
        this.logger.info(1, 2, 3, 'b')
      })

      it('should be able to append to a file', function (done) {
        this.logger.writeStream.once('drain' , function() {
          fs.readFile(failover, 'utf8', function (err, data) {

            should.not.exist(err)

            data
              .split('\n')
              .filter(function(line) {return !!line.trim()})
              .forEach(function(line) {
                var res = JSON.parse(line);
                res.should.have.property("level","info")
                res.should.have.property("file",__filename)
                res.should.have.property("user",user)
                res.should.have.property("data").eql(["1","2","3","b"]) //strings are now managed specially and quotes are removed
              })
            done()
          })
        })
        this.logger.info(1, 2, 3, 'b');
      })
    })
  }
}