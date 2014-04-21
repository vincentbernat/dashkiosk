'use strict';

// A display is associated to a group of dashboards

module.exports = function(sequelize, DataTypes) {
  var Display = sequelize.define('Display', {
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
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true
    },
    chromecast: {
      type: DataTypes.STRING,
      allowNull: true
    },
    viewport: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'Displays',
    classMethods: {
      associate: function(models) {
        Display.belongsTo(models.Group, {onDelete: 'restrict'});
      }
    }
  });

  return Display;
};
