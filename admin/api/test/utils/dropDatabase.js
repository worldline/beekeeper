module.exports = function(Model, callback) {
  var dropDb = function () {
    Model.db.db.dropDatabase(callback)
  }

  if(Model.db.readyState === 1) {
    return dropDb()
  }

  Model.db.on('open', dropDb)
}