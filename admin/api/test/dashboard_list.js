/*global describe: true, after: true, before: true, it: true*/
var mocha             = require('mocha')
  , should            = require('should')
  , api               = require('../')
  , cfg               = require('../lib/config')
  , request           = require('request').defaults({ _json: true, jar: true })
  , fs                = require('fs')
  , async             = require('async')
  , mongoose          = require('mongoose')
  , apiConfig         = cfg.get('api')
  , securityConfig    = cfg.get('security')
  , dashboardsConfig  = cfg.get('dashboards')
  , User              = require('../lib/models/user')
  , Dashboards        = require("../lib/models/dashboards")
  , Widget            = require("../lib/models/widget")
  , dropDatabase      = require('./utils/dropDatabase')

var server = 'http://localhost:' + apiConfig.port + '/user/'
  , dashApi = server + 'me/dashboards/'

describe('DashBoard Lists', function () {
  before(function (done) { api.start(done) })
  after(function (done) { api.stop(done) })

  //delete and init the user
  before(function (done) {
    dropDatabase(User, function (err) {
      if (err) { return done(err) }

      User.create(JSON.parse(fs.readFileSync('./test/fixtures/users.json')), done)
    })
  })
  after(function (done) {dropDatabase(User, done)})

  //delete the dashboard
  before(function (done) {dropDatabase(Dashboards, done)})
  after(function (done) {dropDatabase(Dashboards, done)})

  before(function (done) {
    request.post({
      url:  server + 'login',
      json: {
        username: 'test',
        password: 't3st'
      }
    }, done)
  })

  describe('Listing Dashboards When no dashboards at all', function () {
    it('Should get a No Content response',function (done){
      request.get(dashApi, function (err, res, body) {
        should.not.exist(err)
        res.should.have.status(204)
        should.not.exist(res.body)
        done()
      })
    })
  })

  describe('Listing Dashboards With a empty dashboarbs', function () {
    before(function (done){
      var emptyDash = new Dashboards({username:"test"})
      emptyDash.save(function (err, doc){
        done()
      })
    })

    it('Should return a Dashboards with no dashboards',function (done){
      request.get(dashApi, function (err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)
        res.should.have.property("body")
        res.body.username.should.equal("test")
        res.body.dashboards.should.eql([])

        //no dashboard so no selected
        res.body.should.not.have.property("selectedDashboard")
        done()
      })
    })
  })

  describe('Listing Dashboards With one dashboarbs', function () {
    before(function (done){
      Dashboards.remove({username:"test"} , function (){
        var dashboards = new Dashboards({username:"test",dashboards:[{name : "my dashboard"}]})
        dashboards.save(function (){
          done()
        })
        })
    })

    it('Should return a Dashboards with one dashboard',function (done){
      request.get(dashApi, function (err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)
        res.should.have.property("body")
        res.body.username.should.equal("test")
        res.body.dashboards.length.should.eql(1)
        res.body.dashboards[0].name.should.equal("my dashboard")

        //should.exist(res.body.selected)
        res.body.should.have.property("selectedDashboard")
        res.body.selectedDashboard.should.eql(res.body.dashboards[0]["_id"])

        //no dashboard so no selected
        done()
      })
    })
  })


  describe('Listing Dashboards With two dashboards created one after the other', function () {
    var firstDashboardId
    before(function (done){
      Dashboards.remove({username:"test"} , function (){
        var dashboards = new Dashboards({username:"test",dashboards:[{name : "my dashboard 1"}]})
        dashboards.save(function (err,doc){
          firstDashboardId = ""+ doc.dashboards[0]._id
          doc.dashboards.push({name:"my second dashboard"})
          doc.save(function (){
            done()
          })
        })
      })
    })

    it('Should return a Dashboards with two dashboard, the first being selected',function (done){
      request.get(dashApi, function (err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)
        res.should.have.property("body")
        res.body.username.should.equal("test")
        res.body.dashboards.length.should.eql(2)
        res.body.dashboards[0].name.should.equal("my dashboard 1")
        res.body.dashboards[1].name.should.equal("my second dashboard")

        //should.exist(res.body.selected)
        res.body.should.have.property("selectedDashboard")
        res.body.selectedDashboard.should.eql(firstDashboardId)

        //no dashboard so no selected
        done()
      })
    })
  })

  describe('Given A dashboard with some widgets', function (){
    before(function (done){
      Dashboards.remove({username:"test"} , function (){
        var dashboards = new Dashboards(
          {username:"test",
          dashboards:[
            {
              name : "my dashboard 1",
            },{
              name : "my dashboard 2",
            }
            ]
          })
        dashboards.save(function (err,doc){
          should.not.exist(err)
          var widgets = [
            new Widget({
              username:"test",
              dashboard : doc.dashboards[0]._id,
              name:"Widget 1-1" ,
              type: "graph"
            }),
            new Widget({
              username:"test",
              dashboard : doc.dashboards[0]._id,
              name:"Widget 1-2" ,
              type: "camembert"
            }),
            new Widget({
              username:"test",
              dashboard : doc.dashboards[1]._id,
              name:"Widget 1-2" ,
              type: "tartiflette"
            })
          ]

          async.forEach(widgets,
            function (widget, cb) {
              widget.save(cb)
            }, done
          )
        })
      })
    })

    it("should be retrieved with the widget", function (done){

      request.get(dashApi, function (err, res, body) {
        should.not.exist(err)
        res.should.have.status(200)
        res.should.have.property("body")
        res.body.username.should.equal("test")
        res.body.dashboards.length.should.eql(2)
        res.body.dashboards[0].name.should.equal("my dashboard 1")
        res.body.dashboards[1].name.should.equal("my dashboard 2")


        res.body.dashboards[0].should.have.property("widgets")
        res.body.dashboards[0].widgets.should.have.property("length")
        res.body.dashboards[0].widgets.length.should.eql(2)

        res.body.dashboards[0].widgets[0].name.should.equal("Widget 1-1")
        res.body.dashboards[0].widgets[0].type.should.equal("graph")
        res.body.dashboards[0].widgets[0].should.have.property("height")
        res.body.dashboards[0].widgets[0].should.have.property("width")
        res.body.dashboards[0].widgets[0].should.have.property("position_y")
        res.body.dashboards[0].widgets[0].should.have.property("position_x")
        res.body.dashboards[0].widgets[0].width.should.eql(1)
        res.body.dashboards[0].widgets[1].name.should.equal("Widget 1-2")

        //should.exist(res.body.selected)
        res.body.should.have.property("selectedDashboard")
        res.body.selectedDashboard.should.eql(res.body.dashboards[0]._id)

        //no dashboard so no selected
        done()
      })
    })
  })
})
