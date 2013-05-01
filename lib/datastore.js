/**
 * The datastore itself
 * TODO
 * Improve serialization (for types such as Dates, handle new lines in strings)
 */

var fs = require('fs')
  , path = require('path')
  , customUtils = require('./customUtils')
  ;


/**
 * Create a new collection
 */
function Datastore (filename) {
  this.filename = filename;
  this.data = [];
}


/**
 * Load the database
 * For now this means pulling data out of the data file or creating it
 * if it doesn't exist
 * @param {Function} cb Optional callback, signature: err
 */
Datastore.prototype.loadDatabase = function (cb) {
  var callback = cb || function () {}
    , self = this
    ;

  customUtils.ensureDirectoryExists(path.dirname(self.filename), function (err) {
    fs.exists(self.filename, function (exists) {
      if (!exists) {
        self.data = [];
        fs.writeFile(self.filename, '', 'utf8', function (err) { return callback(err); });
      } else {
        fs.readFile(self.filename, 'utf8', function (err, rawData) {
          if (err) { return callback(err); }
          self.data = Datastore.treatRawData(rawData);
          return callback();
        });
      }
    });
  });
};


/**
 * From a database's raw data, return the corresponding
 * machine understandable collection
 */
Datastore.treatRawData = function (rawData) {
  var data = rawData.split('\n')
    , res = [];

  data.forEach(function (d) {
    var doc;

    try {
      doc = JSON.parse(d);
      res.push(doc);
    } catch (e) {
    }
  });

  return res;
};


/**
 * Insert a new document
 * @param {Function} cb Optional callback, signature: err, insertedDoc
 */
Datastore.prototype.insert = function (newDoc, cb) {
  var callback = cb || function () {}
    , self = this
    , persistableNewDoc
    ;

  try {
    newDoc._id = customUtils.uid(16);
    persistableNewDoc = JSON.stringify(newDoc);
  } catch (e) {
    return callback(e);
  }

  fs.appendFile(self.filename, persistableNewDoc + '\n', 'utf8', function (err) {
    if (err) { return callback(err); }

    var insertedDoc = JSON.parse(persistableNewDoc);
    self.data.push(insertedDoc);   // Make sure the doc is the same on the disk and in memory
                                                     // Some docs can't be stringified correctly
    return callback(null, insertedDoc);
  });
};


/**
 * Check whether object is matched by the given query
 */
Datastore.match = function (obj, query) {
  var match = true;

  Object.keys(query).forEach(function (k) {
    if (obj[k] !== query[k]) { match = false; }
  });

  return match;
};


/**
 * Find all documents matching the query
 * @param {Object} query MongoDB-style query
 */
Datastore.prototype.find = function (query, callback) {
  var res = []
    , self = this
    ;

  self.data.forEach(function (d) {
    if (Datastore.match(d, query)) {
      res.push(d);
    }
  });

  return callback(null, res);
};


var d = new Datastore('workspace/test.db');
d.loadDatabase(function (err) {
  console.log(d.data);
  d.find({ te: "un" }, function (err, docs) {
    console.log(err);
    console.log('------------------');
    console.log(docs);

  });
});

