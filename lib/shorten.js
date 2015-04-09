var rndm = require('rndm'),
    Datastore = require('nedb');

var Shorten = function(options) {
  options = options || {};

  this.db = options.db || new Datastore({filename: 'database.db', autoload: true });
  this.chars = options.chars || '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
  this.codeLength = options.codeLength || 6;
  this.rndgen = rndm.create(this.chars);

  return this;
};

Shorten.prototype.decode = function(code, cb) {
  this.db.findOne({code: code}, cb);
};

Shorten.prototype.encode = function(obj, cb) {
  var self = this,
      uniqueGencode;

  if (!obj) {
    throw Error('No obj input.')
  }

  if (! (cb instanceof Function)) {
    cb = function() {};
  }

  uniqueGencode = function(code) {
    self.db.find({code: code}, function(err, docs) {
      if (err) {
        cb(err, null);
      }

      if (docs.length) {
        uniqueGencode(self.rndgen(self.codeLength));
      } else {
        // get an unique one, save to database
        self.db.insert({
          code: code,
          data: obj,
          hits: 0,
          createdAt: new Date().toISOString()
        }, cb);
      }
    });
  };

  uniqueGencode(self.rndgen(self.codeLength));
};

Shorten.prototype.addHit = function(code, cb) {
  this.db.update({code: code}, {$inc: {hits: 1}}, cb);
};

module.exports = Shorten;
