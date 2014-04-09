// Initial tables

module.exports = {
  up: function(migration, DataTypes, done) {
    migration.createTable('Groups', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    migration.createTable('Dashboards', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      rank: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      timeout: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      GroupId: {
        type: DataTypes.INTEGER,
        references: 'Groups',
        referenceKey: 'id',
        onDelete: 'CASCADE'
      }
    });

    migration.createTable('Displays', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      GroupId: {
        type: DataTypes.INTEGER,
        references: 'Groups',
        referenceKey: 'id',
        onDelete: 'RESTRICT'
      }
    });
    done();
  },
  down: function(migration, DataTypes, done) {
    migration.dropTable('Dashboards');
    migration.dropTable('Groups');
    done();
  }
};
