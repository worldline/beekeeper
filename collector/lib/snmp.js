var mappings = require('./mappings');

var multiplyValuesBy1024 = mappings.multiplier.bind(this, 1024);

exports.generic = function genericSnmpRemap(event) {
  var typeInstance = event.type_instance, remappedEvent;

  if(/^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\:[0-9]{1,5}$/.test(event.type_instance)) {
    // specific 'grid' event when we can match an ip:port in the type_instance.
    event.service = event.type_instance;
    event.plugin = 'grid';
  }

  event.type_instance = 'tmp';
  remappedEvent = this.default(event);
  remappedEvent.data.service = typeInstance;
  remappedEvent.data.type = Object.keys(remappedEvent.data.tmp)[0];
  remappedEvent.data.values  = remappedEvent.data.tmp[remappedEvent.data.type];
  delete remappedEvent.data.tmp;
  return remappedEvent;
};

var swapOverrider = mappings.propertiesOverrider({plugin:'swap', type:'swap'});

exports.swapUsage =  function remapSwapUsage(val) {
  val = swapOverrider(val);
  val = multiplyValuesBy1024(val);
  return this.default(val);
};

var fsOverrider = mappings.propertiesOverrider({ plugin: 'fs', type: 'fs' });

exports.fsUsage =  function remapFsUsage(val) {
  val = fsOverrider(val);
  //get unit and remove it from values
  var idxUnit = val.dsnames.indexOf('unit');
  var unit, i;
  if(idxUnit>-1) {
    unit = val.values[idxUnit];
    ['dsnames','dstypes','values'].forEach(function(key) {
      val[key].splice(idxUnit,1);
    });
  }
  var path = val.type_instance;
  val.type_instance = '';

  val = mappings.multiplier(unit, val);

  val = this.default(val);
  val.data.path = path;
  return val;
};
