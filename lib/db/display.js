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
    }
  }, {
    classMethods: {
      associate: function(models) {
        Display.hasOne(models.Group);
      }
    }
  });

  return Display;
};
