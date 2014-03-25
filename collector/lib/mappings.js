//generic functions to remap collectd objects easily

exports.multiplier = function multiplyValues(multiplier, collectdObj) {
  if(typeof collectdObj !== "object" || ! (collectdObj.values && typeof collectdObj.values.map)) {
    console.warn("could not multiply values of ",collectdObj);
    return collectdObj;
  }

  collectdObj.values = collectdObj.values.map(function(v){return v*multiplier})
  return collectdObj;
}

exports.unprefixer = function (prefix, field /*optional, default : 'type'*/) {
	if(typeof field === "undefined") {
    field = "type";
  }
  field = String(field);

	var re = new RegExp("^"+prefix+"_");
	return function remapWithoutPrefix(val) {
    val[field] = val[field].replace(re,'');
    return val;
	}
}

exports.propertiesOverrider = function objectOverrider (object) {
  return function overrider (initialObject) {
    if (typeof initialObject !== 'object') {
      initialObject = {};
    }

    for(var key in object) {
      if(typeof object[key] === 'object') {
        initialObject[key] = objectOverrider(object[key])(initialObject[key]);
      } else {
        initialObject[key] = object[key];
      }
    }
    return initialObject;
  }
}
