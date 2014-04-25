'use strict';

var setup = require('../.');

var should = require('should'),
    models = require('../../lib/models'),
    Promise = require('bluebird');

describe('Group', function() {

  beforeEach(function(done) {
    // Setup the database
    setup.db()
      .then(function() { done(); }, function(err) { done(err); });
  });

  describe('#chromecast()', function() {
    it('should create chromecast group', function(done) {
      models.Group.chromecast()
        .then(function(group) {
          group.toJSON().name.should.equal('Chromecast devices');
          group.toJSON().description.should.equal('Default group for discovered Chromecast devices');
          done();
        })
        .catch(function(err) { done(err); });
    });

    it('should be present in database', function(done) {
      models.Group.chromecast()
        .then(function(chromecast) {
          return models.Group.get(chromecast.toJSON().id)
            .then(function(group) {
              group.toJSON().id.should.equal(chromecast.toJSON().id);
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should contain no dashboard', function(done) {
      models.Group.chromecast()
        .then(function(chromecast) {
          return chromecast.getDashboards()
            .then(function(dashboards) {
              dashboards.length.should.equal(0);
              done();
            });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#unassigned()', function() {
    it('should create unassigned group', function(done) {
      models.Group.unassigned()
        .then(function(group) {
          group.toJSON().name.should.equal('Unassigned');
          group.toJSON().description.should.equal('Default group for unassigned displays');
          done();
        })
        .catch(function(err) { done(err); });
    });

    it('should create unassigned group once', function(done) {
      Promise.all([models.Group.unassigned(), models.Group.unassigned()])
        .spread(function(u1, u2) {
          u1.toJSON().id.should.equal(u2.toJSON().id);
          done();
        }, function(err) { done(err); });
    });

    it('should not recreate it', function(done) {
      models.Group.unassigned()
        .then(function(unassigned) {
          return models.Group.unassigned()
            .then(function(group) {
              group.toJSON().id.should.equal(unassigned.toJSON().id);
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should be present in database', function(done) {
      models.Group.unassigned()
        .then(function(unassigned) {
          return models.Group.get(unassigned.toJSON().id)
            .then(function(group) {
              group.toJSON().id.should.equal(unassigned.toJSON().id);
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should contain one dashboard', function(done) {
      models.Group.unassigned()
        .then(function(unassigned) {
          return unassigned.getDashboards()
            .then(function(dashboards) {
              dashboards.length.should.equal(1);
              dashboards[0].toJSON().url.should.equal('/unassigned');
              done();
            });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#create()', function() {
    it('should create a new group', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          group.toJSON().name.should.equal('test group');
          return models.Group.get(group.toJSON().id)
            .then(function(ogroup) {
              ogroup.toJSON().id.should.equal(group.toJSON().id);
              ogroup.toJSON().name.should.equal('test group');
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should not accept a group with the same name', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function() {
          var g2 = new models.Group('test group');
          return g2.create()
            .then(function() { done(new Error('group created despite conflict')); },
                  function(err) {
                    err.should.be.an.instanceOf(models.ConflictError);
                    done();
                  });
        })
        .catch(function(err) { done(err); });
    });

    it('should create a group with a given description', function(done) {
      var g = new models.Group('second group',
                               { description: 'my group' });
      g.create()
        .then(function(group) {
          group.toJSON().name.should.equal('second group');
          group.toJSON().description.should.equal('my group');
          done();
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#update()', function() {
    it('should update a group', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.update({name: 'new name',
                               description: 'new description'})
            .then(function() {
              return models.Group.get(group.toJSON().id);
            })
            .then(function(group) {
              group.toJSON().name.should.equal('new name');
              group.toJSON().description.should.equal('new description');
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should not change group name to an existing name', function(done) {
      var g1 = new models.Group('test group 1'),
          g2 = new models.Group('test group 2');
      g1.create()
        .then(function(group1) {
          return g2.create()
            .then(function(group2) {
              return group1.update({name: 'test group 2',
                                    description: 'new description'})
                .then(function() {
                  throw new Error('should not be able to rename group');
                }, function(err) {
                  done();
                });
            });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#all()', function() {
    it('should return all groups', function(done) {
      var g1 = new models.Group('test group 1'),
          g2 = new models.Group('test group 2');
      g1.create()
        .then(function(group1) {
          return g2.create()
            .then(function(group2) {
              return models.Group.all()
                .then(function(groups) {
                  groups[group1.toJSON().id].should.not.equal(undefined);
                  groups[group2.toJSON().id].should.not.equal(undefined);
                  done();
                });
            });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#get()', function() {
    it('should return existing group', function(done) {
      var g1 = new models.Group('test group 1'),
          g2 = new models.Group('test group 2');
      g1.create()
        .then(function(group1) {
          return g2.create()
            .then(function(group2) {
              return models.Group.get(group1.toJSON().id)
                .then(function(group) {
                  group.toJSON().name.should.equal('test group 1');
                  return models.Group.get(group2.toJSON().id);
                })
                .then(function(group) {
                  group.toJSON().name.should.equal('test group 2');
                  done();
                });
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should fail when a group doesn\'t exist', function(done) {
      models.Group.get(1342)
        .then(function() { done(new Error('group should not exist')); },
              function(err) { done(); })
        .catch(function(err) { done(err); });
    });
  });

  describe('#delete()', function() {
    it('should delete an existing group', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.delete()
            .then(function() {
              return models.Group.get(group.toJSON().id)
                .then(function() { done(new Error('group still exists')); },
                      function(err) { done(); });
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should not delete a group with displays', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return models.Display.register('fake')
            .then(function(display) {
              return display.setGroup(group)
                .then(function() {
                  return group.delete()
                    .then(function() { done(new Error('group should not be deleted')); },
                          function(err) {
                            err.should.be.an.instanceOf(models.ConflictError);
                            done();
                          });
                });
            });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#addDashboard()', function() {
    it('should add a new dashboard', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example.com',
                                    { description: 'Fake example',
                                      timeout: 43 })
            .then(function(dashboard) {
              dashboard.toJSON().url.should.equal('http://www.example.com');
              dashboard.toJSON().description.should.equal('Fake example');
              dashboard.toJSON().timeout.should.equal(43);
              return group.getDashboards()
                .then(function(dashboards) {
                  dashboards.length.should.equal(1);
                  dashboards[0].toJSON().url.should.equal('http://www.example.com');
                  done();
                });
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should add several dashboards', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example.com',
                                    { description: 'Fake example',
                                      timeout: 43 })
            .then(function(dashboard1) {
              return group.addDashboard('http://www.example2.com')
                .then(function(dashboard2) {
                  dashboard1.toJSON().url.should.equal('http://www.example.com');
                  dashboard2.toJSON().url.should.equal('http://www.example2.com');
                });
            })
          .then(function() {
            return group.getDashboards()
              .then(function(dashboards) {
                dashboards.length.should.equal(2);
                dashboards[0].toJSON().url.should.equal('http://www.example.com');
                dashboards[1].toJSON().url.should.equal('http://www.example2.com');
                done();
              });
          });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#deleteDashboard()', function() {
    it('should delete a dashboard', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example.com',
                                    { description: 'Fake example',
                                      timeout: 43 })
            .then(function(dashboard) {
              return group.deleteDashboard(dashboard)
                .then(function() {
                  return group.getDashboards()
                    .then(function(dashboards) {
                      dashboards.length.should.equal(0);
                      done();
                    });
                });
            });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#updateDashboard()', function() {
    it('should update an existing dashboard', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example1.com', { timeout: 34 })
            .then(function(dashboard) {
              return group.updateDashboard(dashboard, { url: 'http://www.example2.com',
                                                        description: 'Example' });
            })
            .then(function() {
              return group.getDashboards()
                .then(function(dashboards) {
                  dashboards.length.should.equal(1);
                  dashboards[0].toJSON().url.should.equal('http://www.example2.com');
                  dashboards[0].toJSON().description.should.equal('Example');
                  dashboards[0].toJSON().timeout.should.equal(34);
                  done();
                });
            });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#getDashboard()', function() {
    it('should retrieve an existing dashboard', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example1.com', { timeout: 34 })
            .then(function(dashboard) {
              return group.getDashboard(dashboard.toJSON().id)
                .then(function(dashboard) {
                  dashboard.toJSON().url.should.equal('http://www.example1.com');
                  done();
                });
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should fail when a dashboard doesn\'t exist', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.getDashboard(1434)
            .then(function() { done(new Error('group should not exist')); },
                  function(err) { done(); });
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('#moveDashboard()', function() {
    it('should move dashboards around', function(done) {
      var g = new models.Group('test group');
      var d1, d2, d3;
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example1.com')
            .then(function(dashboard) {
              d1 = dashboard;
              return group.addDashboard('http://www.example2.com');
            })
            .then(function(dashboard) {
              d2 = dashboard;
              return group.addDashboard('http://www.example3.com');
            })
            .then(function(dashboard) {
              d3 = dashboard;
              return group.getDashboards();
            })
            .then(function(dashboards) {
              dashboards.length.should.equal(3);
              return group.moveDashboard(d3, 0);
            })
            .then(function() {
              return group.getDashboards();
            })
            .then(function(dashboards) {
              dashboards.length.should.equal(3);
              dashboards[0].toJSON().url.should.equal('http://www.example3.com');
              dashboards[1].toJSON().url.should.equal('http://www.example1.com');
              dashboards[2].toJSON().url.should.equal('http://www.example2.com');
              return group.moveDashboard(d3, 1);
            })
            .then(function() {
              return group.getDashboards();
            })
            .then(function(dashboards) {
              dashboards.length.should.equal(3);
              dashboards[0].toJSON().url.should.equal('http://www.example1.com');
              dashboards[1].toJSON().url.should.equal('http://www.example3.com');
              dashboards[2].toJSON().url.should.equal('http://www.example2.com');
              return group.moveDashboard(d3, 2);
            })
            .then(function() {
              return group.getDashboards();
            })
            .then(function(dashboards) {
              dashboards.length.should.equal(3);
              dashboards[0].toJSON().url.should.equal('http://www.example1.com');
              dashboards[1].toJSON().url.should.equal('http://www.example2.com');
              dashboards[2].toJSON().url.should.equal('http://www.example3.com');
              return group.moveDashboard(d1, 1);
            })
            .then(function() {
              return group.getDashboards();
            })
            .then(function(dashboards) {
              dashboards.length.should.equal(3);
              dashboards[0].toJSON().url.should.equal('http://www.example2.com');
              dashboards[1].toJSON().url.should.equal('http://www.example1.com');
              dashboards[2].toJSON().url.should.equal('http://www.example3.com');
              return group.moveDashboard(d2, 1);
            })
            .then(function() {
              return group.getDashboards();
            })
            .then(function(dashboards) {
              dashboards.length.should.equal(3);
              dashboards[0].toJSON().url.should.equal('http://www.example1.com');
              dashboards[1].toJSON().url.should.equal('http://www.example2.com');
              dashboards[2].toJSON().url.should.equal('http://www.example3.com');
              done();
            });
        })
        .catch(function(err) { done(err); });
    });
  });

});
