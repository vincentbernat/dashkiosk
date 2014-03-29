'use strict';

var db = require('../../db'),
    _  = require('lodash');

module.exports = function(app) {

  var format = function(display) {
    return _.extend(_.pick(display.values, ['id', 'name', 'description']),
             { group: display.GroupId });
  };

  // Get a list of displays
  app.get('/display', function(req, res, next) {
    db.Display.findAll()
      .then(function(displays) {
        displays = displays.map(function(d) {
          return format(d);
        });
        res.send(_.object(_.pluck(displays, 'name'),
                          displays));
      })
      .catch(function(err) { next(err); });
  });

  // Cannot create a display manually, they have to register themselves

  // Modify a display
  app.put('/display/:id', function(req, res, next) {
    var options = _.pick(req.body, [ 'description' ]);
    db.Display.find({ where: { id: req.param('id') }})
      .then(function(display) {
        if (!display) {
          res.send(404, {
            'message': req.param('id') + ' is not a valid display ID'
          });
        } else {
          return display.updateAttributes(options)
            .then(function(display) {
              res.send(format(display));
            });
        }
        return undefined;
      })
      .catch(function(err) { next(err); });
  });

  // Associate a display to a new group
  app.put('/display/:display_id/group/:group_id', function(req, res, next) {
    db.Display.find({ where: { id: req.param('display_id') }})
      .then(function(display) {
        if (!display) {
          res.send(404, {
            'message': req.param('display_id') + ' is not a valid display ID'
          });
        } else {
          return db.Group.find({where: { id: req.param('group_id') }})
            .then(function(group) {
              if (!group) {
                res.send(404, {
                  'message': req.param('group_id') + ' is not a valid group ID'
                });
              } else {
                return display.setGroup(group)
                  .then(function(display) {
                    res.send(format(display));
                  });
              }
              return undefined;
            });
        }
        return undefined;
      })
      .catch(function(err) { next(err); });
  });

  // Delete a display
  app.delete('/display/:id', function(req, res, next) {
    db.Display.find({ where: { id: req.param('id') }})
      .then(function(display) {
        if (!display) {
          res.send(404, {
            'message': req.param('id') + ' is not a valid display ID'
          });
        } else {
          return display.destroy()
            .then(function() {
              res.send(204);
            });
        }
        return undefined;
      })
      .catch(function(err) { next(err); });
  });

};
