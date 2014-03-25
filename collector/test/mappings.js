/*global describe: true, after: true, before: true, it: true*/
var mocha     = require('mocha')
  , should    = require('should')
  , fs        = require('fs')
  , path      = require('path')
  , mappings  = require('../lib/mappings')

function getCollectdInterface() {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, '/fixtures/interface.json')).toString()
    )
  }

describe('Unprefixer', function () {

	it('should alter the "type" field by default and remove the "if_" prefix', function() {
    var val = mappings.unprefixer("if")(getCollectdInterface())

    should.exist(val)
    val.should.be.type('object')
    val.should.have.property("type")
    val.type.should.not.match(/^if_/)
    val.type.should.equal("octets")
	})

  it('should alter the "type" field if asked explicitely and remove the "if_" prefix', function() {
    var val = mappings.unprefixer("if","type")(getCollectdInterface())

    should.exist(val)
    val.should.be.type('object')
    val.should.have.property("type")
    val.type.should.not.match(/^if_/)
    val.type.should.equal("octets")
  })

  it('should alter the "test" field if asked explicitely and remove the "foo_" prefix', function() {
    var val = mappings.unprefixer("foo","test")({test:"foo_bar"})

    should.exist(val)
    val.should.be.type('object')
    val.should.have.property("test")
    val.test.should.not.match(/^foo_/)
    val.test.should.equal("bar")
  })
})

describe('Properties overrider', function () {

  it('should add the wanted properties with a simple object', function() {
    var val = mappings.propertiesOverrider({foo:"bar", bar:"foo"})
      ({test:1, test2:['a','b','c'], test3:null})

    should.exist(val)
    val.should.be.type('object')
    val.should.have.property("foo", "bar")
    val.should.have.property("bar", "foo")
    val.should.have.property("test", 1)
    val.should.have.property("test2").eql(['a','b','c'])
    val.should.have.property("test3", null)
  })

  it('should replace if necessary the wanted properties with a simple object', function() {
    var val = mappings.propertiesOverrider({foo:"bar", bar:"foo"})
      ({bar:1, test2:['a','b','c'], test3:null})

    should.exist(val)
    val.should.be.type('object')
    val.should.have.property("foo", "bar")
    val.should.have.property("bar", "foo")
    val.should.have.property("test2").eql(['a','b','c'])
    val.should.have.property("test3", null)
  })

  it('should replace if necessary the wanted properties with a complex object thanks to recursion', function() {
    var val = mappings.propertiesOverrider({foo:"bar", bar:{foo:"bar", bar:"foo"}})
      ({bar:{test:"bar", foo:"foo"}, test2:['a','b','c'], test3:null})

    should.exist(val)
    val.should.be.type('object')
    val.should.have.property("foo", "bar")
    val.should.have.property("bar")
    val.bar.should.have.property("bar", "foo")
    val.bar.should.have.property("test", "bar")
    val.should.have.property("test2").eql(['a','b','c'])
    val.should.have.property("test3", null)
  })
})
