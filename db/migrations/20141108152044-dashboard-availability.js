// Add availability column for dashboard

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Dashboards', 'availability', {
        type: DataTypes.TEXT,
        allowNull: true
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Dashboards', 'availability');
    done();
  }
};
