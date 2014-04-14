'use strict';

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash');


// Generic model leveraging the persistence layer. The constructor
// should be provided and should accept a DAO instance as first
// parameter.
function Model() {
  throw new Error('Should be implemented');
}

Model.prototype.refresh = function() {
  var self = this;
  return this.persistent.reload()
    .then(function() {
      return self;
    });
};

Model.prototype.toJSON = function() {
  return _.omit(this.persistent.values,
                [ 'createdAt', 'updatedAt' ]);
};

// Create
Model.prototype.create = function() {
  var self = this;
  return this.persistent.save()
    .then(function() { return self; });
};

// Delete
Model.prototype.delete = function() {
  var self = this;
  return this.persistent.destroy()
    .then(function() { return self; });
};

// Update
Model.prototype.update = function(params) {
  var self = this;
  return this.persistent.updateAttributes(params)
    .then(function() {
      return self;
    });
};

module.exports.Model = Model;

function NotFoundError(msg) {
  Error.call(this);
  Error.captureStackTrace(this, NotFoundError);
  this.message = msg;
  this.name = 'NotFoundError';
  this.httpCode = 404;
}
NotFoundError.prototype = Object.create(Error.prototype);
NotFoundError.prototype.constructor = NotFoundError;
module.exports.NotFoundError = NotFoundError;

function ConflictError(msg) {
  Error.call(this);
  Error.captureStackTrace(this, ConflictError);
  this.message = msg;
  this.name = 'ConflictError';
  this.httpCode = 409;
}
ConflictError.prototype = Object.create(Error.prototype);
ConflictError.prototype.constructor = ConflictError;
module.exports.ConflictError = ConflictError;

fs
  .readdirSync(__dirname)
  .filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js');
  })
  .forEach(function(file) {
    var name = path.basename(file, '.js');
    name = name.charAt(0).toUpperCase() + name.slice(1);
    module.exports[name] = require('./' + file);
  });
