'use strict';

// A dashboard is an URL to be displayed with various
// characteristics. It is attached to some group.

module.exports = function(sequelize, DataTypes) {
  var Dashboard = sequelize.define('Dashboard', {
    rank: {
      type: DataTypes.INTEGER,
      allowNull: true           // as long as the order is consistent, we don't care
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    timeout: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    viewport: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    delay: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    availability: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    classMethods: {
      associate: function(models) {
        Dashboard.belongsTo(models.Group, {onDelete: 'cascade'});
      }
    }
  });

  return Dashboard;
};
