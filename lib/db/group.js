'use strict';

// A group is a succession of dashboards to be displayed by some
// display.

var Sequelize = require('sequelize'),
    _  = require('lodash');

module.exports = function(sequelize, DataTypes) {
  var Group = sequelize.define('Group', {
    name: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    classMethods: {
      associate: function(models) {
        Group.hasMany(models.Dashboard, { onDelete: 'cascade' });
        Group.hasMany(models.Display, { as: 'Displays',
                                        onDelete: 'restrict' });
      },
      // Default dashboard
      unassigned: function() {
        var db = require('../db');
        return Group.findOrCreate({ name: 'unassigned' },
                                  { description: 'Default group for unassigned displays' })
          .spread(function(unassigned, created) {
            if (created) {
              return db.Dashboard.create({ url: '/unassigned',
                                           description: 'Dashboards for unassigned display' })
                .then(function(dashboard) {
                  return unassigned.setDashboards([dashboard]);
                })
                .then(function(unassigneds) {
                  return unassigneds[0];
                });
            }
            return unassigned;
          });
      }
    },
    instanceMethods: {
      // Order correctly instances of a dashboard for the current group
      fixRanking: function(options) {
        return this.getDashboards(_.extend(options,
                                           { order: [['rank', 'ASC'],
                                                     ['id', 'ASC']] }))
          .then(function(dashboards) {
            var i,
                chainer = new Sequelize.Utils.QueryChainer();
            for (i = 0; i < dashboards.length; i++) {
              // We leave a hole to make moving a dashboard to a
              // specific position easier.
              if (dashboards[i].rank !== i*2 + 1) {
                dashboards[i].rank = i*2 + 1;
                chainer.add(dashboards[i].save(options));
              }
            }
            return chainer
              .run()
              .error(function(errors) {
                throw errors[0];
              });
          })
          .then(function() { return this; });
      }
    }
  });

  return Group;
};
