var mongodb = require('mongodb'),
  Code    = mongodb.Code;

// Fake objects to satisfy JSH
var ObjectId, print, db;
// End of Fake objects


function isArray(v) {
  return v && typeof v === 'object' && typeof v.length === 'number' && !(v.propertyIsEnumerable('length'));
}

function isDate(v) {
  return v && typeof v === 'object' && v instanceof Date;
}

function isObjectId(v) {
  return v && typeof v === 'object' && v instanceof ObjectId;
}

function inspectSubDoc(base, value, time){
  var key, k;
  for(key in value) {
    k = key.replace(/\.\d+/g,'[]');
    if(k === key) { // Not an array
      k = "." + k;
    }
    emit(base + k, time);
    if(isArray(value[key]) || (typeof value[key] === 'object' && !isObjectId(value[key]) && !isDate(value[key]))){
      inspectSubDoc(base + k, value[key], time);
    }
  }
}

function map() {
  var key, k, value = this.d;
  for(key in value) {
    k = key.replace(/^\d+$/g,'[]'); // fixes how mongo handles array
    emit(k, this._id.getTimestamp());
    if( isArray(value[key]) || (typeof value[key] === 'object' && !isObjectId(value[key]) && !isDate(value[key]))){
      inspectSubDoc(k, value[key], this._id.getTimestamp());
    }
  }
}

// always returns latest time
function reduce(key, times){
  if(times instanceof Date) {
    return times;
  }
  return new Date(Math.max.apply(null, times));
}

module.exports = {
  scope: {
    isArray: new Code(isArray.toString()),
    isDate: new Code(isDate.toString()),
    isObjectId: new Code(isObjectId.toString()),
    inspectSubDoc: new Code(inspectSubDoc.toString())
  },
  map: map,
  reduce: reduce
};
