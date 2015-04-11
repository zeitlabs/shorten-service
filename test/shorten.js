var should = require('chai').should(),
    Datastore = require('nedb'),
    Shorten = require('../lib/shorten');

describe('Shorten', function() {
  var shorten = null,
      code = null;

  before(function() {
    shorten = new Shorten({
      db: new Datastore({filename: '/tmp/database.db', autoload: true })
    });
  });

  after(function() {
    try {
      require('fs').unlinkSync('/tmp/database.db');
    } catch (e) {}
  });

  describe('Prototype', function() {
    it('should create an instance.', function() {
      shorten.should.be.instanceOf(Shorten);
    });
  });

  describe('Encode', function() {
    it('should get saved result.', function(done) {
      shorten.encode({
        type: 'url',
        value: 'http://eit.tw'
      }, function(err, doc) {
        // doc should look like this
        // { code: 'HNqQvf',
        //   type: 'url'
        //   data: { value: 'http://eit.tw' },
        //   createdAt: '2015-04-05T08:14:47.761Z',
        //   updatedAt: '2015-04-05T08:14:47.761Z',
        //   _id: 'Cq5j5vRAaK9OZHWD' }

        should.not.exist(err);
        should.exist(doc.data);
        doc.type.should.equals('url');
        doc.code.should.have.length(6);
        doc.hits.should.equals(0);
        should.not.Throw(function() {
          Date.parse(doc.createdAt);
          Date.parse(doc.updatedAt);
        });
        code = doc.code;
        done();
      });
    });

    it('should throw Exception if no object input.', function() {
      should.Throw(function() {
        shorten.encode();
      });
    });
  });

  describe('Decode', function() {
    it('should decode and return db object', function(done) {
      shorten.decode(code, function(err, doc) {
        if (err) {
          return done(err)
        }

        if (doc === null) {
          return done('code is not exist.');
        }
        doc.should.be.a.instanceOf(Object);
        done();
      });
    });

    it('should return null object if code is not found', function(done) {
      shorten.decode('Not found', function(err, doc) {
        if (err) {
          return done(err)
        }
        should.not.exist(doc);
        done();
      });
    });
  });

  describe('addHit', function() {
    it('should decode and return db object', function(done) {
      shorten.decode(code, function(err, doc) {
        if (err) {
          return done(err)
        }

        if (doc === null) {
          return done('code is not exist.');
        }
        doc.should.be.a.instanceOf(Object);
        shorten.addHit(code, function(err2, numReplaced) {
          if (err2) {
            throw err2;
          }
          numReplaced.should.be.equals(1);
          shorten.decode(code, function(err3, doc2) {
            if (err3) {
              return done(err3)
            }
            doc2.hits.should.be.equals(1);
            doc2.createdAt.should.not.equals(doc2.updatedAt);
            done();
          });
        });
      });
    });
  });

});
