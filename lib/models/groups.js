'use strict';

var _ = require('lodash'),
    q = require('q'),
    db = require('../db').groups;

function Group(name) {
  this.name = name;
  this.dashboards = [];         // Those should be dashboards
}

// Get instance from DB
Group.prototype.get = function() {
  var deferred = q.defer();
  db.find({ name: this.name },
          function(err, group) {
            if (!!err) {
              deferred.reject(err);
            } else {
              this.dashboards = group.dashboards;
              deferred.resolve(this);
            }
          });
  return deferred;
};

// Save instance to DB
Group.prototype.sync = function() {
  var deferred = q.defer();
  // a findAndModify would be better, but we don't have one...
  db.update({ name: this.name },
            {
              dashboards: this.dashboards
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

module.exports = Group;
