'use strict';

var db = require('../../db'),
    _  = require('lodash');

module.exports = function(app) {

  // Get list of groups
  app.get('/group', function(req, res, next) {
    db.Group.findAll()
      .then(function(groups) {
        groups = groups.map(function(d) {
          return _.pick(d.values, ['id', 'name', 'description']);
        });
        res.send(_.object(_.pluck(groups, 'name'),
                          groups));
      })
      .catch(function(err) { next(err); });
  });

  // Create a new group
  app.post('/group', function(req, res, next) {
    var options = _.pick(req.body, ['name', 'description']);
    if (!options.name) {
      res.send(400, { message: 'Each group should have a name' });
      return;
    }
    db.Group.findOrCreate({ name: options.name }, options)
      .spread(function(group, created) {
        if (!created) {
          res.send(409, { message: 'A group with the same name already exists' });
          return;
        }
        res.send(_.pick(group.values, ['id', 'name', 'description']));
      })
      .catch(function(err) { next(err); });
  });

  // Modify an existing group
  app.put('/group/:id', function(req, res, next) {
    var options = _.pick(req.body, ['name', 'description']);
    db.Group.find({ where: { id: req.param('id') }})
      .then(function(group) {
        if (!group) {
          res.send(404, {
            'message': req.param('id') + ' is not a valid group ID'
          });
        } else {
          return group.updateAttributes(options)
            .then(function(group) {
              res.send(_.pick(group.values, ['id', 'name', 'description']));
            });
        }
        return undefined;
      })
      .catch(function(err) { next(err); });
  });

  // Delete a group
  app.delete('/group/:id', function(req, res, next) {
    db.Group.find({ where: { id: req.param('id') }})
      .then(function(group) {
        if (!group) {
          res.send(404, {
            'message': req.param('id') + ' is not a valid group ID'
          });
        } else {
          return group.getDisplays()
            .then(function(displays) {
              if (displays.length > 0) {
                res.send(409, {
                  'message': 'Group ID ' + req.param('id') + ' is not empty'
                });
              } else {
                return group.destroy()
                  .then(function() {
                    res.send(204);
                  });
              }
              return undefined;
            });
          return undefined;
        }
        return undefined;
      })
      .catch(function(err) { next(err); });
  });

};
