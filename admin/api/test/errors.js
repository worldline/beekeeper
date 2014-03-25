/*global describe: true, after: true, before: true, it: true*/
var mocha         = require('mocha')
  , should        = require('should')
  , fs            = require('fs')
  , api           = require('../')
  , cfg           = require('../lib/config')
  , apiConfig     = cfg.get('api')
  , userUri       = 'http://localhost:' + apiConfig.port + '/user/'
  , errorUri      = 'http://localhost:' + apiConfig.port + '/errors'
  , ClientError   = require('../lib/models/error')
  , User          = require('../lib/models/user')
  , request       = require('request').defaults({ uri: errorUri, _json: true, method: 'POST', jar: true })
  , dropDatabase  = require('./utils/dropDatabase')

describe('Error handler', function () {
  before(function cleanDatabase (done) {
    dropDatabase(ClientError, done)
  })
  after(function cleanDatabase (done) {
    dropDatabase(ClientError, done)
  })

  before(function(done) {
    dropDatabase(User, function(err) {
      if (err) { return done(err) }

      User.create(JSON.parse(fs.readFileSync('./test/fixtures/users.json')), done)
    })
  })
  after(function (done) {dropDatabase(User, done)})

  before(function startServer (done) {
    api.start(done)
  })

  after(function stopServer (done) {
    api.stop(done)
  })

  it('should be able to receive queries', function (done) {
    request({
      json: {
        e: JSON.stringify([1,2,3])
      }
    }, function (err, res, body) {
      should.not.exist(err)
      res.should.have.status(200)
      done()
    })
  })

  it('should persist queries', function (done) {
    ClientError.findOne({}, function (err, doc) {
      should.not.exist(err)
      doc = doc.toObject()
      doc.should.have.property('_id')
      doc.d.should.eql({
        host: '127.0.0.1',
        user: null,
        type: 'error',
        error: [1,2,3]
      })
      done()
    })
  })

  it('should not be able to log errors with invalid request', function (done) {
    request({}, function (err, res, body) {
      should.not.exist(err)
      res.should.have.status(404)
      done()
    })
  })

  it('should log user when available', function (done) {
    request({ uri:  userUri + 'login', json: { username: 'test', password: 't3st' }}, function(err, res, body) {
      should.not.exist(err)
      res.should.have.status(200)

      request({
        json: {
          e: JSON.stringify([1,2,3])
        }
      }, function (err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)

        setTimeout(function() { // Add a delay to let the server persist the log
          ClientError.findOne({ 'd.user': 'test' }, function (err, doc) {
            should.not.exist(err)
            doc = doc.toObject()
            doc.should.have.property('_id')
            doc.d.should.eql({
              host: '127.0.0.1',
              user: 'test',
              type: 'error',
              error: [1,2,3]
            })
            request.get(userUri + 'logout', done)
          })
        }, 10)
      })
    })
  })
})
