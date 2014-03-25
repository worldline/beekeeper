/*global describe: true, after: true, before: true, it: true*/
var mocha = require('mocha'),
  should = require('should'),
  api = require('../'),
  cfg = require('../lib/config'),
  request = require('request').defaults({
    _json: true
  }),
  fs = require('fs'),
  mongoose = require('mongoose'),
  apiConfig = cfg.get('api'),
  Apikey = require('../lib/models/apikey'),
  dropDatabase = require('./utils/dropDatabase')

var server = 'http://localhost:' + apiConfig.port + '/'
  , apikeyApi = server + 'apikey/';

describe('Apikey Crud', function () {
  before(function (done) {
    api.start(done);
  });
  after(function (done) {
    api.stop(done)
  });

  before(function (done) {
    dropDatabase(Apikey, done);
  });
  after(function (done) {
    dropDatabase(Apikey, done);
  });

  describe('Create an apikey', function () {
    it('with no apikey body parameter should return 400 status code', function (done) {
      request({
        method: 'POST',
        url: apikeyApi,
        json: {
        }
      }, function (err, res, body) {
        should.not.exist(err);
        res.should.have.status(400);
        done();
      });
    });
    it('with a new apikey should success', function (done) {
      request({
        method: 'POST',
        url: apikeyApi,
        json: {
          apikey: 'createdapikey'
        }
      }, function (err, res, body) {
        should.not.exist(err);
        res.should.have.status(200);
        body.should.have.property('apikey');
        body.apikey.should.equal('createdapikey');
        Apikey.findOne({apikey: 'createdapikey'}, function (err, apikey) {
          if (err) {
            return done(err);
          }
          should.exist(apikey);
          apikey.apikey.should.equal('createdapikey');
          done();
        });
      });
    });
    it('with an existing apikey should fail', function (done) {
      request({
        method: 'POST',
        url: apikeyApi,
        json: {
          apikey: 'createdapikey'
        }
      }, function (err, res, body) {
        should.not.exist(err);
        res.should.have.status(401);
        done();
      })
    });
  });

  describe('Delete an apikey', function () {

    before(function (done) {
      Apikey.create({apikey: 'validkey'}, function (err, apikey) {
        done(err);
      });
    });

    it('with an existing apikey should success', function (done) {
      request.del(apikeyApi + 'validkey', function (err, res, body) {
        if (err) {
          done(err);
        }
        res.should.have.status(204);
        // check is database is clean
        Apikey.findOne({apikey: 'validkey'}, function (err, apikey) {
          if (err) {
            return done(err);
          }
          should.not.exist(apikey);
          done();
        });
      });
    });
    it('with an invalid apikey should success', function (done) {
      request.del(apikeyApi + 'invalidkey', function (err, res, body) {
        if (err) {
          done(err);
        }
        res.should.have.status(204);
        done();
      });
    });
  });

  describe('GET an apikey', function () {

    before(function (done) {
      Apikey.create({apikey: 'anothervalidkey'}, function (err, apikey) {
        done(err);
      });
    });

    it('with an existing apikey should success', function (done) {
      request({
        method: 'GET',
        url: apikeyApi + 'anothervalidkey'
      }, function (err, res, body) {
        should.not.exist(err);
        res.should.have.status(200);
        body.should.have.property('apikey');
        body.apikey.should.equal('anothervalidkey');
        done();
      });
    });
    it('with an invalid apikey should return 404 status code', function (done) {
      request({
        method: 'GET',
        url: apikeyApi + 'invalidkey'
      }, function (err, res, body) {
        should.not.exist(err);
        res.should.have.status(404);
        done();
      });
    });
  });
});
