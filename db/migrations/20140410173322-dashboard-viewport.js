// Add viewport column for dashboard

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Dashboards', 'viewport', {
        type: DataTypes.TEXT,
        allowNull: true
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Dashboards', 'viewport');
    done();
  }
};
