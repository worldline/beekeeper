var Apikey = require('../../models/apikey'),
  cfg = require('../../config'),
  Logger = require('../../logger'),
  logger = new Logger(module);

var apikeyConfig = cfg.get('apikey');

/**
 * is no apikey allowed
 */
exports.isNoApiKeyAllowed = function(req, res) {
  var code = 403;
  if( apikeyConfig.noApiKeyAllowed ) {
    code = 200;
  }
  res.json(code,{
    allowed:(code==200)
  });
};

/**
 * create an apikey
 *
 * @param apikey <String> new api key (body parameter)
 */
exports.createApikey = function (req, res) {
  if (!req.body.apikey) {
    return res.json(400, {
      error: 'no apikey'
    });
  }
  Apikey.findOne({apikey: req.body.apikey}, function (err, apikey) {
    if (err) {
      logger.warn('tried to check unsuccessfully if apikey already exists :', err);
      return res.json(500, {
        error: 'Internal Server Error'
      });
    }
    if (apikey) {
      return res.json(401, {
        error: 'apikey allready exists: ' + req.body.apikey
      });
    }
    Apikey.create({apikey: req.body.apikey}, function (err, apikey) {
      if (err) {
        logger.warn('tried to create a new apikey unsuccessfully :', err);
        return res.json(500, {
          error: 'Internal Server Error'
        });
      }
      if (apikey) {
        return res.json({
          apikey: apikey.apikey
        });
      }
      logger.warn('apikey creation did not success!');
      return res.json(500, {
        error: 'Internal Server Error'
      });
    });
  });
};

/**
 * delete an apikey
 *
 * @param apikey <String> api key (path parameter)
 */
exports.deleteApikey = function (req, res) {
  if (!req.params.apikey) {
    return res.json(400, {
      error: 'no apikey'
    });
  }
  Apikey.remove({apikey: req.params.apikey}, function (err) {
    if (err) {
      logger.warn('tried to delete apikey <' + req.params.apikey + '> unsuccessfully:', err);
      return res.json(500, {
        error: 'Internal Server Error'
      });
    }
    logger.info('deleted apikey <' + req.params.apikey + '>')
    return res.send(204); // 204 ok, even if the matching didn't work
  });
};

/**
 * get an apikey
 *
 * @param apikey <String> api key (path parameter)
 */
exports.getApikey = function (req, res) {
  if (!req.params.apikey) {
    return res.json(400, {
      error: 'no apikey'
    });
  }
  Apikey.findOne({apikey: req.params.apikey}, function (err, apikey) {
    if (err) {
      logger.warn('apikey <' + req.params.apikey + '> unsuccessfully fetched :', err);
      return res.json(500, {
        error: 'Internal Server Error'
      });
    }
    if (apikey) {
      return res.json({
        apikey: apikey.apikey
      });
    }
    return res.send(404);
  });
}
