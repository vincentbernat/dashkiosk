'use strict';

// A dashboard is an URL to be displayed with various
// characteristics. It is attached to some group.

module.exports = function(sequelize, DataTypes) {
  var Dashboard = sequelize.define('Dashboard', {
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
    }
  }, {
    classMethods: {
      associate: function(models) {
        Dashboard.belongsTo(models.Group);
      }
    }
  });

  return Dashboard;
};
