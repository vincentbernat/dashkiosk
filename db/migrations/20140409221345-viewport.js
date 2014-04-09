// Add viewport column

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Displays', 'viewport', {
        type: DataTypes.STRING,
        allowNull: true
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Displays', 'viewport');
    done();
  }
};
