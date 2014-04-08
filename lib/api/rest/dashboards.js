'use strict';

var models = require('../../models'),
    _  = require('lodash');

module.exports = function(app) {

  // Get a list of dashboards
  app.get('/group/:id/dashboard', function(req, res, next) {
    models.Group.get(req.param('id'))
      .then(function(group) {
        return group.getDashboards();
      })
      .then(function(dashboards) {
        res.send(_.map(dashboards, function(d) { return d.toJSON(); }));
      })
      .catch(function(err) { next(err); });
  });

  // Create a new dashboard
  app.post('/group/:id/dashboard', function(req, res, next) {
    if (!req.body.url) {
      res.send(400, { message: 'Each dashboard should have an URL.' });
      return;
    }

    models.Group.get(req.param('id'))
      .then(function(group) {
        return group.addDashboard(req.body.url, req.body);
      })
      .then(function(dashboard) {
        res.send(201, dashboard.toJSON());
      })
      .catch(function(err) { next(err); });
  });

  // Modify a dashboard. We also accept a rank to move the dashboard
  // to the specified rank (pushing other dashboards to higher ranks).
  app.put('/group/:group_id/dashboard/:dashboard_id', function(req, res, next) {
    models.Group.get(req.param('group_id'))
      .then(function(group) {
        return group.getDashboard(req.param('dashboard_id'))
          .then(function(dashboard) {
            return group.updateDashboard(dashboard, _.omit(req.body, 'rank'));
          })
          .then(function(dashboard) {
            var rank = req.body.rank;
            if (rank === null ||
                rank === undefined) {
              return dashboard;
            }
            rank = parseInt(rank);
            return group.moveDashboard(dashboard, rank);
          });
      })
      .then(function(dashboard) {
        res.send(dashboard.toJSON());
      })
      .catch(function(err) { next(err); });
  });

  // Delete a dashboard
  app.delete('/group/:group_id/dashboard/:dashboard_id', function(req, res, next) {
    models.Group.get(req.param('group_id'))
      .then(function(group) {
        return group.getDashboard(req.param('dashboard_id'))
          .then(function(dashboard) {
            return group.deleteDashboard(dashboard);
          });
      })
      .then(function() {
        res.send(204);
      })
      .catch(function(err) { next(err); });
  });

};
