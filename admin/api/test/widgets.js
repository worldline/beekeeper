/*global describe: true, after: true, before: true, it: true*/
var mocha             = require('mocha')
  , should            = require('should')
  , api               = require('../')
  , cfg               = require('../lib/config')
  , request           = require('request').defaults({ _json: true, jar: true })
  , mongoose          = require('mongoose')
  , ObjectID          = mongoose.mongo.ObjectID
  , fs                = require('fs')
  , async             = require('async')
  , apiConfig         = cfg.get('api')
  , securityConfig    = cfg.get('security')
  , dashboardsConfig  = cfg.get('dashboards')
  , User              = require('../lib/models/user')
  , Widget            = require('../lib/models/widget')
  , dropDatabase      = require('./utils/dropDatabase')

var server = 'http://localhost:' + apiConfig.port + '/user/'
  , widgetsApi = 'http://localhost:' + apiConfig.port + '/user/me/widgets/'
  , dashboardId1 = new ObjectID()
  , dashboardId2 = new ObjectID()
  , dashboardId3 = new ObjectID()
  , dashboardId4 = new ObjectID()

function widgetCompare (node1, node2) {
  if (node1._id < node2._id) {
    return -1;
  }
  if (node1._id > node2._id) {
    return 1;
  }
  return 0;
}

function createWidget(username, name, type, dashboard) {
  return new Widget({
    username: username,
    name: name,
    type: type,
    dashboard: dashboard
  })
}

function testWidget(widget, expected) {
  widget.should.have.property('_id')
  widget = widget.toObject ? widget.toObject() : widget
  if(!expected._id) {
    delete widget._id
  }
  widget.should.eql(expected)
}

describe('Widgets Lists', function() {
  before(function(done) { api.start(done) })
  after(function(done) { api.stop(done) })

  // Delete and init the user
  before(function(done) {
    dropDatabase(User, function(err) {
      if (err) { return done(err) }

      User.create(JSON.parse(fs.readFileSync('./test/fixtures/users.json')), done)
    })
  })

  after(function(done){dropDatabase(User, done)})

  // Delete the dashboard
  before(function(done){dropDatabase(Widget, done)})
  after(function(done){dropDatabase(Widget, done)})

  // Pre-authenticate further reqests
  before(function(done) {
    request.post({
      url:  server + 'login',
      json: {
        username: 'test',
        password: 't3st'
      }
    }, done)
  })

  describe('Without any widget in the database', function(){
    it('should return 0 widgets', function (done){
      request.get(widgetsApi, function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(204)
        res.should.not.have.property('body')
        done()
      })
    })
  })

  describe('Given widgets in the database but for other users' , function(){
    before(function(done) {
      var widget1 = createWidget('hiddenUser', 'Widget 1-1', 'graph', dashboardId1)
        , widget3 = createWidget('hiddenUser', 'Widget 1-2', 'tartiflette',dashboardId1)
        , widget2 = createWidget('hiddenUser', 'Widget 1-2', 'camembert', dashboardId1)

      async.forEach([widget1,widget2,widget3], function(widget,cb) { widget.save(cb) }, done)
    })

    it('should return 0 widgets', function(done){
      request.get(widgetsApi, function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(204)
        res.should.not.have.property('body')
        should.not.exist(body)
        done()
      })
    })
  })

  describe('Given One widget for the current user' , function() {
    before(function(done) {
      var widget1 = createWidget('test', 'Widget 1-1', 'graph', dashboardId2)
      widget1.save(done)
    })

    it('should return 1 widgets with the good properties', function(done){
      request.get(widgetsApi  , function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)

        // The response is always an array
        body.should.have.length(1)

        testWidget(res.body[0], {
          username: 'test',
          name: 'Widget 1-1',
          type: 'graph',
          dashboard: dashboardId2.toString(),
          formulas : [],
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        done()
      })
    })
  })

  describe('Given three widgets for the current user', function() {
    before(function(done){
      var widget2 = createWidget('test', 'Widget 2-1', 'graph', dashboardId3)
        , widget3 = createWidget('test', 'Widget 3-1', 'graph', dashboardId3)

      async.forEach([widget2,widget3], function(widget,cb){widget.save(cb)}, done)
    })

    it('should return 3 widgets with the good properties', function(done) {
      request.get(widgetsApi, function(err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)

        // The response is always an array
        body.should.have.length(3)

        res.body.sort(widgetCompare)

        testWidget(res.body[0], {
          username: 'test',
          name: 'Widget 1-1',
          type: 'graph',
          formulas : [],
          dashboard: dashboardId2.toString(),
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        testWidget(res.body[1], {
          username: 'test',
          name: 'Widget 2-1',
          type: 'graph',
          formulas : [],
          dashboard: dashboardId3.toString(),
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        testWidget(res.body[2], {
          username: 'test',
          name: 'Widget 3-1',
          type: 'graph',
          formulas : [],
          dashboard: dashboardId3.toString(),
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        done()
      })
    })
  })

  describe('Removing one of the widget', function(){
    var widgetId

    before(function(done){
      // Creating a new disposable widget
      var newWidget = createWidget('test', 'Widget 2 Delete', 'toErase', new ObjectID())

      newWidget.save(function(err, docs){
        widgetId = docs._id
        done(err, docs)
      })
    })

    it('should return ok', function(done){
      request.del(widgetsApi + widgetId, function(err, res, body){
        res.should.have.status(204)
        res.should.not.have.property('body')
        should.not.exist(body)
        done()
      })
    })

    it('should should have only 3 remaining wigets now', function(done){
      Widget.find({username:'test'}, function(err, docs){
        docs.should.have.length(3)
        done(err)
      })
    })

    it('should not retrieve the deleted id', function(done){
      Widget.find({_id: widgetId.toString() }, function(err, docs) {
        docs.should.be.empty
        done(err)
      })
    })
  })

  describe('trying to remove a unknow widget with a bad ObjectID',function(){
    it('should return a 404', function(done){
      request.del(widgetsApi + 'CarottesId', function(err, res, body){
        res.should.have.status(404)
        body.should.eql({ error: 'Document with id CarottesId not found or access forbidden' })
        done()
      })
    })
  })

  describe('trying to remove a unknow widget with a valid ObjectID',function(){
    it('should return a 404', function(done){
      var id = new ObjectID()
      request.del(widgetsApi + id, function(err, res, body) {
        res.should.have.status(404)
        body.should.eql({ error: 'Document with id ' + id + ' not found or access forbidden' })
        done()
      })
    })
  })

  describe('trying to remove a widget from another user',function(){
    before(function(done){
      //creating a new widget
      var newWidget = createWidget('pocahontas', 'Widget 2 Delete', 'toErase', new ObjectID())

      newWidget.save(function(err, docs) {
        done(err, docs)
      })
    })


    it('should return a 404', function(done){
      var id = new ObjectID()
      request.del(widgetsApi + id, function(err, res, body){
        res.should.have.status(404)
        body.should.eql({ error: 'Document with id ' + id + ' not found or access forbidden' })
        done()
      })
    })
  })

  describe('trying to update a widget from me user',function() {
    var widgetId
    before(function(done){
      //creating a new widget
      var newWidget = createWidget('test', 'Widget 2 Delete', 'myself', dashboardId4)
      newWidget.save(function(err, docs){
        widgetId = docs._id
        done(err, docs)
      })
    })

    it('should be possible', function(done){
      request.put({ url: widgetsApi + widgetId,
        json: {
          _id : widgetId,
          username:'boule',
          name:'Widget 2 Delete',
          type: 'flower'
        }
      }, function(req, res, body) {
          res.should.have.status(204)
          done()
      })
    })

    it('should have change only autorized field', function(done){
      Widget.find({ _id : widgetId }, function(err, docs){
        docs.should.have.length(1)
        testWidget(docs[0], {
          _id: widgetId,
          username: 'test',
          name: 'Widget 2 Delete',
          type: 'flower',
          formulas : [],
          dashboard: dashboardId4,
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        done(err, docs)
      })
    })
  })

  describe('trying to change the id of a widget', function(){
    var widgetId, newObjectId = new ObjectID()

    before(function(done) {
      //creating a new widget
      var newWidget = createWidget('test', 'widget with ID tochange', 'myself', new ObjectID())
      newWidget.save(function(err, docs) {
        should.not.exist(err)
        widgetId = docs._id
        done(err, docs)
      })
    })

    it('should not respond with bad answer', function(done) {
      request.put({url:widgetsApi + widgetId,
        json: {
          _id : newObjectId,
          type : 'CrazyType'
        }},
        function(req, res, body) {
          res.should.have.status(204)
          done()
        })
    })

    it('should not have created an object with new ID', function(done){
      Widget.find({_id : newObjectId }, function(err, docs){
        docs.should.have.length(0)
        done(err)
      })
    })

    it('should not have delete the object with old ID', function(done){
      Widget.find({_id : widgetId }, function(err, docs){
        docs.should.have.length(1)
        done(err)
      })
    })
  })

  describe('trying to update a widget from another user',function() {
    var widgetId

    before(function(done){
      //creating a new widget
      var newWidget = createWidget('boule', 'Widget 2 Delete', 'toErase', new ObjectID())
      newWidget.save(function(err, docs){
        should.not.exist(err)
        widgetId = docs._id
        done(err, docs)
      })
    })

    it('should no be possible with keeping the username', function(done){
      request.put({ url: widgetsApi + widgetId,
        json: {
          _id : widgetId.toString(),
          username:'boule',
          name:'Widget 2 Delete',
          type: 'BD'
        }
      }, function(req, res, body){
        res.should.have.status(404)
        done()
      })
    })

    it('should no be possible with changing the username to our', function(done){
      request.put({url:widgetsApi + widgetId,
        json: {
          _id : widgetId,
          username:'test',
          name:'Widget 2 Delete',
          type: 'BD'
        }
      }, function(req, res, body){
        res.should.have.status(404)
        done()
      })
    })
  })

  describe('When creating a new widget with no Id',function() {
    var widgetId, dashboardId = new ObjectID()

    it('should respond with the provided widget', function(done){
      request.post({
        url: widgetsApi,
        json: {
          name: 'BrandNewWidget',
          type: 'secret',
          dashboard: dashboardId
        }
      }, function(res, req, body) {
        widgetId = body._id
        testWidget(body, {
          _id: widgetId,
          username: 'test',
          formulas : [],
          name: 'BrandNewWidget',
          type: 'secret',
          dashboard: dashboardId.toString(),
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })
        done()
      })
    })

    it('should be avaialble in the database and with new attributes', function(done){
      Widget.find({ _id: widgetId }, function(err, docs) {
        docs.should.have.length(1)
        testWidget(docs[0], {
          _id: new ObjectID(widgetId),
          username: 'test',
          name: 'BrandNewWidget',
          type: 'secret',
          formulas : [],
          dashboard: dashboardId,
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        done()
      })
    })
  })

  describe('When creating a new widget with an ID',function() {
    var widgetId = new ObjectID(), dashboardId = new ObjectID(), newWidgetId
    it('should respond with the provided widget with a different id', function(done) {
      request.post({
        url: widgetsApi,
        json: {
          _id: widgetId.toString(),
          name:'BrandNewWidget',
          type:'secret',
          dashboard : dashboardId
        }
      }, function(res, req, body) {
        newWidgetId = body._id
        body._id.should.not.eql(widgetId)
        testWidget(body, {
          username: 'test',
          name: 'BrandNewWidget',
          type: 'secret',
          formulas : [],
          dashboard: dashboardId.toString(),
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        done()
      })
    })

    it('should not be available with the provided id', function(done){
      Widget.find({_id : widgetId}, function(err, docs){
        docs.should.be.empty
        done(err)
      })
    })

    it('should be available with the returned id', function(done){
      Widget.find({_id : newWidgetId}, function(err, docs){
        docs.should.have.length(1)

        testWidget(docs[0], {
          _id: new ObjectID(newWidgetId),
          username: 'test',
          name: 'BrandNewWidget',
          type: 'secret',
          formulas : [],
          dashboard: dashboardId,
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        done()
      })
    })
  })

  describe('When creating a new widget with specified user ',function(){
    var widgetId = new ObjectID(), dashboardId = new ObjectID(), newWidgetId

    it('should respond with the provided widget ', function(done){
      request.post({
        url: widgetsApi,
        json: {
          name:'BrandNewWidget',
          type:'secret',
          username : 'mybestfriend',
          dashboard: dashboardId
        }
      }, function(res, req, body) {
        newWidgetId = body._id
        body._id.should.not.eql(widgetId.toString())
        testWidget(body, {
          name:'BrandNewWidget',
          type:'secret',
          username : 'test',
          dashboard: dashboardId.toString(),
          formulas : [],
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })
        done()
      })
    })

    it('should have been saved for the current user', function(done){
      Widget.find({_id: newWidgetId}, function(err, docs){
        docs.should.have.length(1)

        testWidget(docs[0], {
          _id: new ObjectID(newWidgetId),
          name:'BrandNewWidget',
          type:'secret',
          username : 'test',
          dashboard: dashboardId,
          formulas : [],
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0
        })

        done()
      })
    })
  })



  describe('When saving new widget', function() {
    var dashboardId = new ObjectID(), widgetId
    it('should not be possible to add new properties', function(done){
      request.post({ url:widgetsApi,
        json: {
          name:'Hellworld',
          type:'crazy',
          superFeatures:'MaxiBest',
          big:78,
          dashboard: dashboardId
        }
      }, function(req,res,body) {
        widgetId = body._id
        testWidget(body, {
          username: 'test',
          name:'Hellworld',
          type:'crazy',
          formulas : [],
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0,
          dashboard: dashboardId.toString()
        })

        done()
      } )
    })

    it('should not be possible to retrieve this property', function(done){
      Widget.find({_id : widgetId}, function(err, docs){
        docs.should.have.length(1)
        testWidget(docs[0], {
          username: 'test',
          name:'Hellworld',
          type:'crazy',
          formulas : [],
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0,
          dashboard: dashboardId
        })
        done()
      })
    })
  })

  describe('When udpating new widget', function(){
    var widgetId, dashboardId = new ObjectID()
    before(function(done){
      request.post({url:widgetsApi,
        json: {
          name:'Hellworlda',
          type:'updatingcrazy',
          dashboard: dashboardId
        }
      }, function(req,res,body) {
        widgetId = body._id
        done()
      })
    })

    it('should not be possible to add new properties', function(done){
      request.put({ url: widgetsApi + widgetId,
        json: {
          name:'Hellworld',
          type:'updatedcrazy',
          superFeatures:'MaxiBest',
          big:78
        }
      }, function(req,res,body){
         res.should.have.status(204)
         done()
      })
    })

    it('should not be possible to retrieve this property', function(done){
      Widget.find({_id : widgetId}, function(err, docs){
        docs.should.have.length(1)
        testWidget(docs[0], {
          _id: new ObjectID(widgetId),
          username: 'test',
          name:'Hellworld',
          type:'updatedcrazy',
          formulas : [],
          height: 1,
          width: 1,
          position_y: 0,
          position_x: 0,
          dashboard: dashboardId
        })
        done()
      })
    })
  })
})
