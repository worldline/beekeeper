/*global describe: true, after: true, before: true, it: true*/
var mocha           = require('mocha')
  , should          = require('should')
  , api             = require('../')
  , request         = require('request').defaults({ _json: true })
  , fs              = require('fs')
  , cfg             = require('../lib/config')
  , apiConfig       = cfg.get('api')
  , hierarchyConfig = cfg.get('hierarchy')
  , mongoose        = require('mongoose')
  , Node            = require('../lib/models/node')
  , dropDatabase      = require('./utils/dropDatabase')


var server = 'http://localhost:' + apiConfig.port + '/hierarchy/'

describe('Hierarchy API', function () {
  before(function (done) { api.start(done) })
  after(function (done) { api.stop(done) })

  before(function (done) {
    dropDatabase(Node, function (err) {
      if (err) { return done(err) }

      Node.create(JSON.parse(fs.readFileSync('./test/fixtures/hierarchy.json')), done)
    })
  })

  after(function (done) { dropDatabase(Node, done) })

  describe('Roots', function () {
    it('should be accessible via the root url', function (done) {
      request(server, function (err, res, body) {
        should.not.exist(err)
        body.should.eql([
         {
            type: 'geographic',
            name: 'geographic',
            _id: '500406e9d7d8ac9a15000012',
            updated: '2012-07-16T12:19:53.664Z',
            ancestors: []
          },
           { type: 'logic',
            name: 'logic',
            _id: '500406e9d7d8ac9a15000001',
            updated: '2012-07-16T12:19:53.659Z',
            ancestors: []
          }
        ])
        done()
      })
    })

    it('should send children via the :id/children url', function (done) {
      request(server + '500406e9d7d8ac9a15000001/children', function (err, res, body) {
        should.not.exist(err)
        body.should.eql([
          {
            'parent':'500406e9d7d8ac9a15000001',
            'name':'namespace0',
            'type':'namespace',
            '_id':'500406e9d7d8ac9a15000002',
            'updated':'2012-07-16T12:19:53.661Z',
            'ancestors':['500406e9d7d8ac9a15000001']
          },{
            'parent':'500406e9d7d8ac9a15000001',
            'name':'namespace1',
            'type':'namespace',
            '_id':'500406e9d7d8ac9a15000003',
            'updated':'2012-07-16T12:19:53.661Z',
            'ancestors':['500406e9d7d8ac9a15000001']
          },{
            'parent':'500406e9d7d8ac9a15000001',
            'name':'namespace2',
            'type':'namespace',
            '_id':'500406e9d7d8ac9a15000004',
            'updated':'2012-07-16T12:19:53.661Z',
            'ancestors':['500406e9d7d8ac9a15000001']
          },{
            'parent':'500406e9d7d8ac9a15000001',
            'name':'namespace3',
            'type':'namespace',
            '_id':'500406e9d7d8ac9a15000005',
            'updated':'2012-07-16T12:19:53.661Z',
            'ancestors':['500406e9d7d8ac9a15000001']
          },{
            'parent':'500406e9d7d8ac9a15000001',
            'name':'namespace4',
            'type':'namespace',
            '_id':'500406e9d7d8ac9a15000006',
            'updated':'2012-07-16T12:19:53.662Z',
            'ancestors':['500406e9d7d8ac9a15000001']
          }
        ])
        done()
      })
    })

    it('should send named child via the :id/child/:name url', function (done) {
      request(server + '500406e9d7d8ac9a15000001/child/namespace0', function (err, res, body) {
        should.not.exist(err)
        body.should.eql({
            'parent':'500406e9d7d8ac9a15000001',
            'name':'namespace0',
            'type':'namespace',
            '_id':'500406e9d7d8ac9a15000002',
            'updated':'2012-07-16T12:19:53.661Z',
            'ancestors':['500406e9d7d8ac9a15000001']
          })
        done()
      })
    })
  })



  describe('Nodes', function () {
    it('should be accessible by Id', function (done) {
      request(server + '500406e9d7d8ac9a15000004', function (err, res, body) {
        should.not.exist(err)
        body.should.eql([
          {
            'parent':'500406e9d7d8ac9a15000001',
            'name':'namespace2',
            'type':'namespace',
            '_id':'500406e9d7d8ac9a15000004',
            'updated':'2012-07-16T12:19:53.661Z',
            'ancestors':['500406e9d7d8ac9a15000001']
          }
        ])
        done()
      })
    })

    it('should send an error for cheesy Id', function (done) {
      request(server + 'tartiflette', function (err, res, body) {
        should.not.exist(err)
        should.exist(body.message)
        body.message.should.equal('CastError: Cast to ObjectId failed for value "tartiflette" at path "_id"')
        done()
      })
    })

    it('should send children via the :id/children url', function (done) {
      request(server + '500406e9d7d8ac9a15000004/children', function (err, res, body) {
        should.not.exist(err)
        body.should.eql([
          {
            'parent':'500406e9d7d8ac9a15000004',
            'name':'service9',
            'type':'service',
            '_id':'500406e9d7d8ac9a1500000b',
            'updated':'2012-07-16T12:19:53.662Z',
            'ancestors':[
              '500406e9d7d8ac9a15000001',
              '500406e9d7d8ac9a15000004'
            ]
          }, {
            'parent':'500406e9d7d8ac9a15000004',
            'name':'service910',
            'type':'service',
            '_id':'500406e9d7d8ac9a1500000c',
            'updated':'2012-07-16T12:19:53.662Z',
            'ancestors':[
              '500406e9d7d8ac9a15000001',
              '500406e9d7d8ac9a15000004'
            ]
          }, {
            'parent':'500406e9d7d8ac9a15000004',
            'name':'service911'
            ,'type':'service',
            '_id':'500406e9d7d8ac9a1500000d',
            'updated':'2012-07-16T12:19:53.662Z',
            'ancestors':[
              '500406e9d7d8ac9a15000001',
              '500406e9d7d8ac9a15000004'
            ]
          }
        ])
        done()
      })
    })

    it('should send named child via the :id/child/:name url', function (done) {
      request(server + '500406e9d7d8ac9a15000004/child/service910', function (err, res, body) {
        should.not.exist(err)
        body.should.eql({
            'parent':'500406e9d7d8ac9a15000004',
            'name':'service910',
            'type':'service',
            '_id':'500406e9d7d8ac9a1500000c',
            'updated':'2012-07-16T12:19:53.662Z',
            'ancestors':[
              '500406e9d7d8ac9a15000001',
              '500406e9d7d8ac9a15000004'
            ]
          })
        done()
      })
    })


    it('should send an Error on /:id url for non-existant id', function (done) {
      request(server + '500406e9d7d8ac9a15080001', function (err, res, body) {
        should.not.exist(err)
        should.exist(body.message)
        body.message.should.equal('No Node found')
        done()
      })
    })

    it('should send an Error on /:id/children url for non-existant id', function (done) {
      request(server + '500406e9d7d8ac9a15000007/children', function (err, res, body) {
        should.not.exist(err)
        res.statusCode.should.eql(204)
        should.not.exist(body);
        done()
      })
    })
  })
})
