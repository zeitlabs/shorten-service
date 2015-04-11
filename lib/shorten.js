var rndm = require('rndm'),
    Datastore = require('nedb');

var Shorten = function(options) {
  options = options || {};
  options.dbFilename = options.dbFilename || '/tmp/database.db';
  this.db = options.db || new Datastore({filename: options.dbFilename, autoload: true });
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
        var type = obj.type || 'url',
            timestamp = new Date().toISOString();
        delete obj.type;
        self.db.insert({
          code: code,
          type: type,
          data: obj,
          hits: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        }, cb);
      }
    });
  };

  uniqueGencode(self.rndgen(self.codeLength));
};

Shorten.prototype.addHit = function(code, cb) {
  var timestamp = new Date().toISOString();
  this.db.update(
    {code: code},
    {
      $inc: {hits: 1},
      $set: {updatedAt: timestamp}
    },
    cb);
};

module.exports = Shorten;
