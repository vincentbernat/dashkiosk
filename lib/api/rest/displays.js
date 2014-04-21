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
        return display.update(_.omit(req.body, ['ip', 'chromecast']));
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

  // Request an action on a display
  app.post('/display/:name/action', function(req, res, next) {
    var action = req.body.action;

    models.Display.get(req.param('name'))
      .then(function(display) {
        switch (action) {
        case 'reload':
          return display.reload();
        case 'osd':
          return display.osd(req.body.text || null);
        default:
          res.send(400, { message: 'Unknown action requested.' });
          return undefined;
        }
      })
      .then(function(display) {
        if (display) {
          res.send(202, display.toJSON());
        }
      })
      .catch(function(err) { next(err); });
  });

};
