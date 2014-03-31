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
      }
    },
    instanceMethods: {
      // Order correctly instances of a dashboard for the current group
      fixRanking: function(options) {
        return this.getDashboards(_.extend(options || {},
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
