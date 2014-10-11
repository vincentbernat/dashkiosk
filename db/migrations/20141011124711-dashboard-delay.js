// Add delay column for dashboard

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.addColumn('Dashboards', 'delay', {
        type: DataTypes.INTEGER,
        allowNull: true
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    migration.removeColumn('Dashboards', 'delay');
    done();
  }
};
