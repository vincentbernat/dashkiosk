'use strict';

var _  = require('lodash'),
    models = require('../../models');

module.exports = function(app) {

  // Get a list of displays
  app.get('/display', function(req, res, next) {
    models.Display.all()
      .then(function(displays) {
        res.send(_.mapValues(displays, function(g) { return g.toJSON(); }));
      })
      .catch(function(err) { next(err); });
  });

  // Cannot create a display manually, they have to register themselves

  // Modify a display
  app.put('/display/:name', function(req, res, next) {
    models.Display.get(req.param('name'))
      .then(function(display) {
        return display.update(req.body);
      })
      .then(function(display) {
        res.send(display.toJSON());
      })
      .catch(function(err) { next(err); });
  });

  // Associate a display to a new group
  app.put('/display/:name/group/:group_id', function(req, res, next) {
    models.Display.get(req.param('name'))
      .then(function(display) {
        return models.Group.get(req.param('group_id'))
          .then(function(group) {
            return display.setGroup(group)
              .then(function(display) {
                res.send(display.toJSON());
              });
          });
      })
      .catch(function(err) { next(err); });
  });

  // Delete a display
  app.delete('/display/:name', function(req, res, next) {
    models.Display.get(req.param('name'))
      .then(function(display) {
        return display.delete();
      })
      .then(function() {
        res.send(204);
      })
      .catch(function(err) { next(err); });
  });

};
