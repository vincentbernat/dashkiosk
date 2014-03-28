'use strict';

// A group is a succession of dashboards to be displayed by some
// display.

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
        Group.hasMany(models.Dashboard);
        Group.belongsTo(models.Display);
      },
      unassigned: function() {
        // Return the default dashboard
        var db = require('../db');
        return Group.findOrCreate({ name: 'unassigned' }, {})
          .spread(function(unassigned, created) {
            if (created) {
              return db.Dashboard.create({ url: '/unassigned' })
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
    }
  });

  return Group;
};
