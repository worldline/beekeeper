/*global describe: true, after: true, before: true, it: true*/
var mocha = require('mocha'),
  should = require('should'),
  api = require('../'),
  cfg = require('../lib/config'),
  request = require('request').defaults({
    _json: true,
    jar: true
  }),
  fs = require('fs'),
  mongoose = require('mongoose'),
  apiConfig = cfg.get('api'),
  dashboardConfig = cfg.get('security'),
  User = require('../lib/models/user'),
  DashBoards = require('../lib/models/dashboards'),
  dropDatabase = require('./utils/dropDatabase')

  var server = 'http://localhost:' + apiConfig.port + '/user/',
  dashApi = server + 'me/dashboards/dashboard/'

describe('DashBoards Crud', function() {
  before(function(done) {
    api.start(done)
  })
  after(function(done) {
    api.stop(done)
  })

  before(function(done) {
    dropDatabase(User, function(err) {
      if (err) {
        return done(err)
      }

      User.create(JSON.parse(fs.readFileSync('./test/fixtures/users.json')), done)
    })
  })
  after(function(done) {
    dropDatabase(User, done)
  })

  before(function(done) {
    dropDatabase(DashBoards, done)
  })
  after(function(done) {
    dropDatabase(DashBoards, done)
  })

  before(function authenticate(done) {
    request.post({
      url: server + 'login',
      json: {
        username: 'test',
        password: 't3st'
      }
    }, done)
  })

  describe('Create Dashboard for a user with no dashboard', function() {
    it('Should broadcast to mongo and give acknowledge', function(done) {
      request({
        method: 'POST',
        url: dashApi,
        json: {
          name: 'Dashboard1'
        }
      }, function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)
        body.should.have.property('_id')
        body.name.should.equal('Dashboard1')
        done()
      })
    })

    it('should have created a Dashboards in the database', function(done) {
      DashBoards.find({
        username: "test"
      }, function(err, docs) {
        docs.should.have.property("length")
        docs.length.should.eql(1)

        docs[0].should.have.property("username")
        docs[0].username.should.equal("test")

        docs[0].should.have.property("dashboards")
        docs[0].dashboards.should.have.property("length")

        docs[0].dashboards[0].should.have.property("name")
        docs[0].dashboards[0].name.should.equal('Dashboard1')

        done()
      })
    })
  })

  describe('Create a new Dashboard for a user with a dashboard', function() {
    // Removing all dashboard
    before(function(done) {
      DashBoards.update({
        username: "test"
      }, {
        $set: {
          dashboards: []
        }
      }, done)
    })

    // Creating a dash
    before(function(done) {
      DashBoards.update({
        username: "test"
      }, {
        $push: {
          dashboards: {
            name: "allreadhere"
          }
        }
      }, done)
    })

    it('should be able to create a new Dashboard', function(done) {
      request({
        method: 'POST',
        url: dashApi,
        json: {
          name: 'new dashboard'
        }
      }, function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)
        body.should.have.property('_id')
        body.name.should.equal('new dashboard')
        done()
      })
    })

    it('should find the 2 dashboards in the base', function(done) {
      DashBoards.find({
        username: "test"
      }, function(err, docs) {
        docs.should.have.property("length")
        docs.length.should.eql(1)

        docs[0].should.have.property("username")
        docs[0].username.should.equal("test")

        docs[0].should.have.property("dashboards")
        docs[0].dashboards.should.have.property("length")

        docs[0].dashboards[0].should.have.property("name")
        docs[0].dashboards[0].name.should.equal("allreadhere")

        docs[0].dashboards[1].should.have.property("name")
        docs[0].dashboards[1].name.should.equal("new dashboard")

        done()
      })
    })

  })


  describe('Create unnamed Dashboard', function() {
    it('Should break', function(done) {
      request({
        method: 'POST',
        url: dashApi,
        json: {
          dashName: ""
        }
      }, function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(400)
        body.should.eql({
          error: 'no name'
        })
        done()
      })
    })
  })

  describe('Delete Dashboard', function() {
    before(function(done) {
      DashBoards.update({
        username: "test"
      }, {
        $push: {
          dashboards: {
            name: "two"
          }
        }
      }, done)
    })

    it('Should broadcast to mongo and acknowledge deletion', function(done) {
      DashBoards.findOne({
        username: 'test'
      }, function(err, doc) {
        if (err) {
          return done(err)
        }

        var found;
        if (doc.dashboards.some(function(dash) {
          return dash.name === 'two' ? found = dash : false
        })) {
          return request.del(dashApi + found._id, function(err, res, body) {
            should.not.exist(err)
            res.should.have.status(204)
            res.should.not.have.property("body")
            done()
          })
        }
        done(new Error('Dashboard not found'))
      })
    })
  })

  describe('Delete invalid Dashboard id', function() {
    it('Should broadcast to mongo and give error', function(done) {
      request.del(dashApi + 'toto', function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(503)
        res.should.have.property('body')
        done()
      })
    })
  })
})
