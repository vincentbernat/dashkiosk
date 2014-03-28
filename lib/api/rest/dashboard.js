'use strict';

var db = require('../../db'),
    _  = require('lodash');

module.exports = function(app) {

  app.get('/dashboard', function(req, res, next) {
    return db.Dashboard.findAll()
      .then(function(dashboards) {
        dashboards = dashboards.map(function(d) { return d.values; });
        console.log(dashboards, _.pluck(dashboards, 'name'),
                    _.pick(dashboards, ['id', 'description', 'url', 'timeout']));
        res.send(_.object(_.pluck(dashboards, 'name'),
                          _.pick(dashboards, ['id', 'description', 'url', 'timeout'])));
      })
      .catch(function(err) { next(err); });
  });

};
