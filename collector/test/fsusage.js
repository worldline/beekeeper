/*global describe: true, after: true, before: true, it: true*/
var mocha = require('mocha'),
  should = require('should'),
  fs = require('fs'),
  path = require('path'),
  mock = require('./mocks/putter'),
  putter = mock.putter;

function getCollectdSnmp() {
  return fs.readFileSync(path.join(__dirname, '/fixtures/fs_usage.json'), 'utf8');
}

describe('fs_usage Snmp Remapper', function() {
  describe('if we have a snmp fs_usage collectd object', function() {
    var val, json;
    before(function() {
      json = getCollectdSnmp();
    })

    it('should remap the object to be requestable', function() {
      val = putter(json);

      should.exist(val);
      val.should.be.type('object');
      val.should.have.property("type", "fs");
      val.data.should.have.property("host", "datagrid02");
      val.data.should.have.property("path", "_mnt");
      val.data.size.should.equal(3112960 * 65536);
      val.data.used.should.equal(105006 * 65536);
    })
  })
})
