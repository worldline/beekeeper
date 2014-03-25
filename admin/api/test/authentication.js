/*global describe: true, after: true, before: true, it: true*/
var mocha           = require('mocha')
  , should          = require('should')
  , api             = require('../')
  , request         = require('request').defaults({ _json: true, jar: true })
  , fs              = require('fs')
  , cfg             = require('../lib/config')
  , apiConfig       = cfg.get('api')
  , User            = require('../lib/models/user')
  , dropDatabase    = require('./utils/dropDatabase')

var server = 'http://localhost:' + apiConfig.port + '/user/';
describe('security', function () {
  before(function (done) { api.start(done); })
  after(function (done) { api.stop(done); })

  before(function (done) {
    dropDatabase(User, function (err) {
      if (err) { return done(err) }

      User.create(JSON.parse(fs.readFileSync('./test/fixtures/users.json')), done)
    })
  })
  after(function (done) {dropDatabase(User, done)})

  describe('anonymous user', function () {
    it('should be rejected', function (done) {
      request(server + 'me', function (err, res, body) {
        should.not.exist(err);
        body.should.eql({'message': 'Not authenticated'});
        done();
      });
    })
  })

  describe('authenticating user', function () {
    describe('with no password', function () {
      it('should be rejected', function (done) {
        request.post(server + 'login', function (err, res, body) {
          should.not.exist(err);
          body.should.eql({ message: 'Invalid user' });
          done();
        })
      })
    })
    describe('with wrong password', function () {
      it('should be rejected', function (done) {
        request.post({
          url:  server + 'login',
          json: {
            username: 'test',
            password: 'w00t'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          body.should.eql({ message: 'Invalid user' });
          done();
        })
      })
    })
    describe('with correct password', function () {
      it('should be accepted', function (done) {
        request.post({
          url:  server + 'login',
          json: {
            username: 'test',
            password: 't3st'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          body.should.have.property('_id');
          delete body._id;
          body.should.eql({username: 'test' });
          done();
        })
      })
      it('should keep logged in on further queries', function (done) {
        request(server + 'me', function (err, res, body) {
          should.not.exist(err);
          body.should.have.property('_id');
          delete body._id;
          body.should.eql({'username': 'test'});
          done();
        });
      })

      it('should be able to disconnect', function (done) {
        request(server + 'logout', function (err, res, body) {
          should.not.exist(err);
          res.statusCode.should.equal(200);
          body.should.eql({ message: "ok" });
          done();
        })
      })

      it('should be rejected once logged out', function (done) {
        request(server + 'me', function (err, res, body) {
          should.not.exist(err);
          body.should.eql({'message': 'Not authenticated'});
          done();
        });
      })

      it('should be able to login again with wrong casing', function (done) {
        request.post({
          url:  server + 'login',
          json: {
            username: 'TeSt',
            password: 't3st'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          body.should.have.property('_id');
          delete body._id;
          body.should.eql({username: 'test' });
          done();
        })
      });
    });
  });

  describe('updating user password', function () {
    before(function (done) {
      request(server + 'logout', function (err, res, body) {
        if (err) { return done(err) }
        User.create({"username": "test2", "password": "092a20ef9e709021bd3e7afe7a35e86a6a888445b207ef7f7004cf3b85d75b5a"}, done);
      });
    });

    it('should fail when not authenticated', function (done) {
      request.put({
        url: server + 'me/password',
        json: {
          newpassword: 't3st'
        }
      }, function (err, res, body) {
        should.not.exist(err);
        res.statusCode.should.eql(401);
        body.should.eql({'message': 'Not authenticated'});
        done();
      });
    });

    describe('when authenticated', function () {
      before(function (done) {
        request.post({
          url:  server + 'login',
          json: {
            username: 'test2',
            password: 't3st'
          }
        }, function (err, res, body) {
          done(err);
        });
      });

      it('should not be able to update password without old password', function (done) {
        request.put({
          url: server + 'me/password',
          json: {
            newpassword: 't3st'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          res.statusCode.should.eql(406);
          body.should.eql({'message': 'oldpassword body parameter is mandatory'});
          done();
        });
      });

      it('should not be able to update password without new password', function (done) {
        request.put({
          url: server + 'me/password',
          json: {
            oldpassword: 't3st'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          res.statusCode.should.eql(406);
          body.should.eql({'message': 'newpassword body parameter is mandatory'});
          done();
        });
      });

      it('should not be able to update password with same password', function (done) {
        request.put({
          url: server + 'me/password',
          json: {
            oldpassword: 't3st',
            newpassword: 't3st'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          res.statusCode.should.eql(406);
          body.should.eql({'message': 'oldpassword and newpassword can\'t be equal'});
          done();
        });
      });

      it('should not be able to update password with weak new password', function (done) {
        request.put({
          url: server + 'me/password',
          json: {
            oldpassword: 't3st',
            newpassword: '1234'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          res.statusCode.should.eql(406);
          body.should.eql({'message': 'newpassword must be at least 5 characters long'});
          done();
        });
      });

      it('should not be able to update password with wrong old password', function (done) {
        request.put({
          url: server + 'me/password',
          json: {
            oldpassword: 't3st1',
            newpassword: 't3st2'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          res.statusCode.should.eql(403);
          body.should.eql({'message': 'bad oldpassword'});
          done();
        });
      });

      it('should be able to update password', function (done) {
        request.put({
          url: server + 'me/password',
          json: {
            oldpassword: 't3st',
            newpassword: 't3st2'
          }
        }, function (err, res, body) {
          should.not.exist(err);
          res.statusCode.should.eql(200);
          body.should.eql({'message': 'password updated'});
          done();
        });
      });
    });
  });
});
