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
    models.Display.get(req.params.name)
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
    models.Display.get(req.params.name)
      .then(function(display) {
        return models.Group.get(req.params.group_id)
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
    models.Display.get(req.params.name)
      .then(function(display) {
        return display.delete();
      })
      .then(function() {
        res.sendStatus(204);
      })
      .catch(function(err) { next(err); });
  });

  // Request an action on a display
  app.post('/display/:name/action', function(req, res, next) {
    var action = req.body.action;

    models.Display.get(req.params.name)
      .then(function(display) {
        switch (action) {
        case 'reload':
          return display.reload();
        case 'osd':
          return display.osd(req.body.text || null);
        default:
          res.status(400).send({ message: 'Unknown action requested.' });
          return undefined;
        }
      })
      .then(function(display) {
        if (display) {
          res.status(202).send(display.toJSON());
        }
      })
      .catch(function(err) { next(err); });
  });

};
