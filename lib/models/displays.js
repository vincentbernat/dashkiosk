'use strict';

var _ = require('lodash'),
    q = require('q'),
    winston = require('winston'),
    db = require('../db').displays,
    Group = require('../models').Group;

function Display(name) {
  this.name = name;
  this.group = new Group('unassigned');
}

// Get instance from DB, recursive
Display.prototype.get = function() {
  var deferred = q.defer();
  db.find({ name: this.name },
          function(err, group) {
            if (!!err) {
              deferred.reject(err);
            } else {
              if (this.group) {
                this.group
                  .get()
                  .catch(function(error) {
                    winston.warn('inexistant %s group for display %s',
                                 this.group, this.name);
                    this.group = new Group('unassigned');
                  })
                  .then(function() {
                    deferred.resolve(this);
                  });
              }
            }
          });
  return deferred;
};

// Save instance to DB, not recursive
Display.prototype.sync = function() {
  var deferred = q.defer();
  // a findAndModify would be better, but we don't have one...
  db.update({ name: this.name },
            {
              group: this.group.name
            },
            { upsert: true }, function(err) {
              if (!!err) {
                deferred.reject(err);
              } else {
                deferred.resolve(this);
              }
            });
  return deferred;
};

module.exports = Display;
