'use strict';

var models = require('../../models'),
    _  = require('lodash');

module.exports = function(app) {

  // Get list of groups
  app.get('/group', function(req, res, next) {
    models.Group.all()
      .then(function(groups) {
        res.send(_.mapValues(groups, function(g) { return g.toJSON(); }));
      })
      .catch(function(err) { next(err); });
  });

  // Create a new group
  app.post('/group', function(req, res, next) {
    var options = req.body;
    if (!options.name) {
      res.send(400, { message: 'Each group should have a name.' });
      return;
    }
    new models.Group(options.name, options).create()
      .then(function(group) {
        res.send(201, group.toJSON());
      })
      .catch(function(err) { next(err); });
  });

  // Modify an existing group
  app.put('/group/:id', function(req, res, next) {
    var options = req.body;
    models.Group.get(req.param('id'))
      .then(function(group) {
        return group.update(options);
      })
      .then(function(group) {
        res.send(group.toJSON());
      })
      .catch(function(err) { next(err); });
  });

  // Delete a group
  app.delete('/group/:id', function(req, res, next) {
    models.Group.get(req.param('id'))
      .then(function(group) {
        return group.delete();
      })
      .then(function() {
        res.send(204);
      })
      .catch(function(err) { next(err); });
  });

};
