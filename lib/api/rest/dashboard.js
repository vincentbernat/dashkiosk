'use strict';

var db = require('../../db'),
    _  = require('lodash');

module.exports = function(app) {

  var format = function(dashboard) {
    return _.pick(dashboard.values, ['id', 'url', 'description', 'timeout']);
  };

  // Get a list of dashboards
  app.get('/group/:id/dashboard', function(req, res, next) {
    db.Group.find({ where: { id: req.param('id') }})
      .then(function(group) {
        if (!group) {
          res.send(404, {
            'message': req.param('id') + ' is not a valid group ID'
          });
        } else {
          return group.getDashboards({order: [['rank', 'ASC'],
                                              ['id', 'ASC']] })
            .then(function(dashboards) {
              dashboards = dashboards.map(format);
              res.send(dashboards);
            });
        }
        return undefined;
      })
      .catch(function(err) { next(err); });
  });

  // Create a new dashboard
  app.post('/group/:id/dashboard', function(req, res, next) {
    var options = _.pick(req.body, ['url', 'description', 'timeout']);
    if (!options.url) {
      res.send(400, { message: 'Each dashboard should have an URL' });
      return;
    }

    db.sequelize.transaction({ autocommit: false }, function(t) {
      return db.Group.find({ where: { id: req.param('id') },
                             transaction: t })
        .then(function(group) {
          if (!group) {
            res.send(404, {
              'message': req.param('id') + ' is not a valid group ID'
            });
          } else {
            return db.Dashboard.create(_.extend(options, { rank: 10000 }),
                                       { transaction: t })
              .then(function(dashboard) {
                return group.addDashboard(dashboard, { transaction: t })
                  .then(function() {
                    return group.fixRanking({ transaction: t });
                  })
                  .then(function() {
                    return dashboard.reload({ transaction: t });
                  });
              })
              .then(function(dashboard) {
                res.send(format(dashboard));
              });
          }
          return undefined;
        })
        .then(function() { t.commit(); })
        .catch(function(err) { t.rollback(); next(err); });
      }, function(err) { next(err); });
  });

  function onDashboard(req, res, next,
                       fn) {
    db.sequelize.transaction({ autocommit: false }, function(t) {
      return db.Group.find({ where: { id: req.param('group_id') },
                             transaction: t })
        .then(function(group) {
          if (!group) {
            res.send(404, {
              'message': req.param('group_id') + ' is not a valid group ID'
            });
          } else {
            return group.getDashboards({ where: { id: req.param('dashboard_id') },
                                         transaction: t })
              .then(function(dashboards) {
                if (dashboards.length === 0) {
                  res.send(404, {
                    'message': req.param('dashboard_id') + ' is not a valid dashboard ID'
                  });
                } else {
                  var dashboard = dashboards[0];
                  return fn(group, dashboard,
                            { transaction: t });
                }
                return undefined;
              });
          }
          return undefined;
        })
        .then(function(f) { t.commit(); })
        .catch(function(err) { t.rollback(); next(err); });
    }, function(err) { next(err); });
  }

  // Modify a dashboard. We also accept a rank to move the dashboard
  // to the specified rank (pushing other dashboards to higher ranks).
  app.put('/group/:group_id/dashboard/:dashboard_id', function(req, res, next) {
    var options = _.pick(req.body, ['url', 'description', 'timeout']),
        rank = req.body.rank;
    onDashboard(req, res, next,
                function(group, dashboard, more) {
                  return dashboard.updateAttributes(options, more)
                    .then(function(dashboard) {
                      if (rank === undefined ||
                          rank === null) {
                        return dashboard;
                      }
                      // Ensure we are already sorted
                      return group.fixRanking(more)
                        .then(function() {
                          return dashboard.updateAttributes({
                            rank: rank * 2
                          }, more);
                          // We don't need to fix ranking again,
                          // ranking is fine as is
                        });
                    })
                    .then(function(dashboard) {
                      res.send(format(dashboard));
                    });
                });
  });

  // Delete a dashboard
  app.delete('/group/:group_id/dashboard/:dashboard_id', function(req, res, next) {
    var options = _.pick(req.body, ['url', 'description', 'timeout']);
    onDashboard(req, res, next,
                function(group, dashboard, more) {
                  return dashboard.destroy(more).then(function(dashboard) {
                      res.send(204);
                  });
                });
  });

};
