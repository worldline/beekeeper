var passport         = require('passport')
  , LocalStrategy    = require('passport-local').Strategy
  , passportSocketIo = require('passport.socketio')
  , cfg              = require('../../config')
  , crypto           = require('crypto')
  , securityConfig   = cfg.get('security')
  , express          = require('express')
  , MongoStore       = require('connect-mongo')(express)
  , User             = require('../../models/user')
  , Logger           = require('../../logger')
  , logger           = new Logger(module)
  ;

function hashPassword(password) {
  var sha256 = crypto.createHash(securityConfig.hashType)
  sha256.update(password)
  return sha256.digest(securityConfig.digestType)
}

var errors = {
    invalidUser:      { message: 'Invalid user' },
    notAuthenticated: { message: 'Not authenticated' }
  }
  , initialize = passport.initialize()
  , sessionSetup = {
      key:    'beekeeper.sid',
      cookie: {
        path:     '/',
        httpOnly: true,
        maxAge:   1 * 31 * 24 * 60 * 60 * 1000 // 1 month expiry
      },
      store:  new MongoStore({
        host:           securityConfig.db.host,
        port:           securityConfig.db.port,
        db:             securityConfig.db.database,
        username:       securityConfig.db.options.user,
        password:       securityConfig.db.options.pass,
        collection:     securityConfig.db.collections.sessions.name,
        auto_reconnect: true
      })
    }
  , mongoSession = express.session(sessionSetup)
  , configureWSAuth = passportSocketIo.authorize({
      cookieParser:  express.cookieParser,
      key:    sessionSetup.key,      //the cookie where express (or connect) stores its session id.
      store:  sessionSetup.store,    //the session store that express uses
      secret: securityConfig.secret  //the session secret to parse the cookie
    });

passport.use(new LocalStrategy(function (username, password, done) {
  username = (username || '').toLowerCase()
  User.findOne({ username: username, password: hashPassword(password) }, { 'username': 1 }, function (err, user) {
    if (err)   { return done(err) }
    if (!user) { return done(null, false, errors.invalidUser) }
    return done(null, user)
  })
}))

// Provide persistence functions for users
passport.serializeUser(function (user, done) {
  user.save(function (err) {
    if (err) {
      return done(err)
    }
    done(null, user._id.toString())
  })
})

passport.deserializeUser(function (user, done) {
  User.findById(user, { 'username': 1 }, done)
})

module.exports =  {
  // Setup function mainly to allow mongodb connection to be established
  setup: function (req, res, next) {
    mongoSession(req, res, function (err) {
      if (err) {
        return next(err)
      }
      return initialize(req, res, next)
    })
  },

  // Session middleware
  session: passport.session(),

  // Middleware to filter anonymous queries
  ensureAuthenticated: function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    return res.json(401, errors.notAuthenticated)
  },

  // Route to return current user if any
  me: function (req, res) {
    if (req.isAuthenticated()) {
      logger.user(req.user.username).log('is authenticated')
      return res.json(req.user)
    }
    logger.info(req.ip, 'has failed to authenticate')
    return res.json(401, errors.notAuthenticated)
  },

  updatePassword: function (req, res, next) {
    if (!req.isAuthenticated()) {
      return res.json(401, errors.notAuthenticated);
    }
    if (!req.body) {
      return res.json(406, {message: 'body is mandatory'});
    }
    if (!req.body.oldpassword || req.body.oldpassword === '') {
      return res.json(406, {message: 'oldpassword body parameter is mandatory'});
    }
    if (!req.body.newpassword || req.body.newpassword === '') {
      return res.json(406, {message: 'newpassword body parameter is mandatory'});
    }
    if (req.body.oldpassword === req.body.newpassword) {
      return res.json(406, {message: 'oldpassword and newpassword can\'t be equal'});
    }
    if (req.body.newpassword.length < 5) {
      return res.json(406, {message: 'newpassword must be at least 5 characters long'});
    }
    User.findOne({ username: req.user.username }, function (err, user) {
      if (err)   { return next(err) }
      if (!user) { return next(errors.invalidUser) }
      if (hashPassword(req.body.oldpassword) !== user.password) {
        return res.json(403, {message: 'bad oldpassword'});
      }
      user.password = hashPassword(req.body.newpassword);
      user.save(function (err) {
        if (err) { return next(err) }
        res.json(200, {message: 'password updated'});
      });
    })
  },

  login: function (req, res, next) {
    passport.authenticate('local', function (err, user) {
      if (err) {
        return res.json(503, err)
      }
      if (!user) {
        logger.warn(req.ip, 'has failed to login with user <', req.body.username, '>')
        return res.json(403, errors.invalidUser)
      }
      req.login(user, function (err) {
        if (err) {
          return res.json(503, err)
        }
        logger.user(req.user.username).log('has logged in successfully')
        res.json(user)
      })
    })(req, res, next)
  },

  logout: function (req, res) {
    if (!req.user) {
      return res.json({ message: "ok" });
    }
    var user = req.user.username;
    req.logout()
    logger.user(user).log('has logged out')
    return res.json({ message: "ok" })
  },

  authWS: function (handshakeData, accept) {
    configureWSAuth(handshakeData, function (err, authorized) {
      if (err) { // an error happened or user
        logger.error("Authentication failed for", handshakeData.address.address, ':', err)
        return accept(err, authorized);
      } else if (!authorized) {
        logger.user(handshakeData.user.username).warn("tried to access WS but was not authorized")
        return accept(err, authorized);
      }
      logger.user(handshakeData.user.username).trace("authorized on WS")
      return accept(null, true);
    });
  }
}
