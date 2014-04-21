'use strict';

var setup = require('../../.');

var should = require('should'),
    ioserver = require('socket.io').listen(5000, {
      'log level': 0
    }), // I hate that
    ioclient = require('socket.io-client'),
    _ = require('lodash'),
    models = require('../../../lib/models'),
    api = require('../../../lib/api'),
    Promise = require('bluebird');

api.socketio(ioserver);

var options = {
  transports: ['websocket'],
  'force new connection': true,
  'reconnection delay' : 0,
  'reopen delay' : 0
};

describe('socket.io changes API', function() {

  beforeEach(function(done) {
    // Setup the database
    setup.db()
      .then(function() { done(); }, function(err) { done(err); });
  });

  describe('on connect', function() {
    it('should send an empty snapshot', function(done) {
      var client = ioclient.connect('http://127.0.0.1:5000/changes', options);
      client.once('snapshot', function(data) {
        data.should.eql({});
        done();
      });
    });

    it('should send an up-to-date snapshot', function(done) {
      var g1 = new models.Group('test group 1', { description: 'my first new group' }),
          g2 = new models.Group('test group 2', { description: 'my second new group' }),
          d1 = models.Display.register(),
          d2 = models.Display.register();
      Promise.all([g1.create(), g2.create(), d1, d2])
        .spread(function(group1, group2, display1, display2) {
          return Promise.all([g1.addDashboard('http://www.example1.com'),
                              g2.addDashboard('http://www.example2.com', { timeout: 30 })])
            .then(function() {
              return Promise.all([g1.addDashboard('http://www.example3.com'),
                                  g2.addDashboard('http://www.example4.com')]);
            }, function(err) { done(err); })
            .then(function() {
              var client = ioclient.connect('http://127.0.0.1:5000/changes', options);
              client.once('snapshot', function(data) {
                try {
                  // We should have three groups
                  _.pluck(data, 'name').sort()
                    .should.eql(['test group 1', 'test group 2', 'Unassigned'].sort());

                  // Let's check test group 1
                  var group1 = _.find(data, function(g) { return g.name === 'test group 1'; });
                  group1.should.have.property('description', 'my first new group');
                  group1.should.have.property('displays');
                  group1.displays.should.eql({});
                  group1.should.have.property('dashboards');
                  group1.dashboards.length.should.equal(2);
                  group1.dashboards[0].should.have.property('url', 'http://www.example1.com');
                  group1.dashboards[1].should.have.property('url', 'http://www.example3.com');

                  // Let's check test group 2
                  var group2 = _.find(data, function(g) { return g.name === 'test group 2'; });
                  group2.should.have.property('description', 'my second new group');
                  group2.should.have.property('displays');
                  group2.displays.should.eql({});
                  group2.should.have.property('dashboards');
                  group2.dashboards.length.should.equal(2);
                  group2.dashboards[0].should.have.property('url', 'http://www.example2.com');
                  group2.dashboards[0].should.have.property('timeout', 30);
                  group2.dashboards[1].should.have.property('url', 'http://www.example4.com');

                  // Let's check unassigned
                  var unassigned = _.find(data, function(g) { return g.name === 'Unassigned'; });
                  unassigned.should.have.property('description', 'Default group for unassigned displays');
                  unassigned.should.have.property('displays');
                  _.keys(unassigned.displays).length.should.equal(2); // Two clients
                  unassigned.should.have.property('dashboards');
                  unassigned.dashboards.length.should.equal(1);

                  done();
                } catch (err) {
                  done(err);
                }
              });
            }, function(err) { done(err); });
        }, function(err) { done(err); });
    });
  });

  describe('on update', function() {
    it('should send a group update when adding a dashboard', function(done) {
      var g = new models.Group('test group'),
          d = models.Display.register(); // Just to ensure that the unassigned group already exists
      Promise.all([g.create(), d])
        .spread(function(group, display) {
          var client = ioclient.connect('http://127.0.0.1:5000/changes', options);
          client.once('snapshot', function(data) {
            // Got a snapshot, let's add a dashboard
            var once = false;
            client.on('group.updated', function(data) {
              try {
                if (data.name !== 'test group' || once) {
                  return;
                }
                once = true;
                data.name.should.equal('test group');
                data.id.should.equal(group.toJSON().id);
                data.should.have.property('dashboards');
                data.dashboards.length.should.equal(1);
                data.dashboards[0].url.should.equal('http://www.example3.com');
                done();
              } catch (err) {
                done(err);
              }
            });
            group.addDashboard('http://www.example3.com')
              .catch(function(err) { done(err); });
          });
        })
        .catch(function(err) { done(err); });
    });

    it('should send a group delete when deleting a group', function(done) {
      var g = new models.Group('test group'),
          d = models.Display.register(); // Just to ensure that the unassigned group already exists
      Promise.all([g.create(), d])
        .spread(function(group, display) {
          var client = ioclient.connect('http://127.0.0.1:5000/changes', options);
          client.once('snapshot', function(data) {
            // Got a snapshot
            client.once('group.deleted', function(data) {
              try {
                data.id.should.equal(group.toJSON().id);
                done();
              } catch (err) {
                done(err);
              }
            });
            group.delete()
              .catch(function(err) { done(err); });
          });
        })
        .catch(function(err) { done(err); });
    });

    it('should send a display update when updating a display property', function(done) {
      var d = models.Display.register(); // Just to ensure that the unassigned group already exists
      d
        .then(function(display) {
          var client = ioclient.connect('http://127.0.0.1:5000/changes', options);
          client.once('snapshot', function(data) {
            // Got a snapshot
            client.once('display.updated', function(data) {
              try {
                data.description.should.equal('shiny client');
                data.id.should.equal(display.toJSON().id);
                done();
              } catch (err) {
                done(err);
              }
            });
            display.update({ description: 'shiny client' })
              .catch(function(err) { done(err); });
          });
        })
        .catch(function(err) { done(err); });
    });
  });

});
