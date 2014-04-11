// Add IP column for displays

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Displays', 'ip', {
      type: DataTypes.STRING,
      allowNull: true
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Displays', 'ip');
    done();
  }
};
