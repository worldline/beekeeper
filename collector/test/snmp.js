/*global describe: true, after: true, before: true, it: true*/
var mocha = require('mocha'),
  should = require('should'),
  fs = require('fs'),
  path = require('path'),
  mock = require('./mocks/putter'),
  putter = mock.putter;

function getCollectdSnmp() {
  return fs.readFileSync(path.join(__dirname, '/fixtures/grid.json'), 'utf8')
}

describe('Generic Snmp Remapper', function() {
  describe('if we have a snmp for a service', function() {
    var val, json;
    before(function() {
      json = getCollectdSnmp();
    })

    it('should remap the object to be requestable', function() {
      val = putter(json);
      should.exist(val);
      val.should.be.type('object').and.have.property('type', 'grid');
      val.data.service.should.equal('1.1.1.1:1111');
    })
  })
})
