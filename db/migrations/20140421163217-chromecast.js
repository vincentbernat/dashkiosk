// Add Chromecast ID for display

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Displays', 'chromecast', {
      type: DataTypes.STRING,
      allowNull: true
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Displays', 'chromecast');
    done();
  }
};
