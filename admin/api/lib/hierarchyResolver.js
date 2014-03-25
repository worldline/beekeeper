var PEG           = require("pegjs")
  , fs            = require('fs')
  , path          = require('path')
  ;
module.exports = PEG.buildParser(fs.readFileSync(path.join(__dirname , 'hierarchyResolver.peg')).toString())