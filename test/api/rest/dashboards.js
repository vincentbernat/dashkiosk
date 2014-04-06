'use strict';

var setup = require('../../.');

var should = require('should'),
    express = require('express'),
    request = require('supertest'),
    _ = require('lodash'),
    models = require('../../../lib/models'),
    bus = require('../../../lib/bus'),
    api = require('../../../lib/api'),
    app = express();

api.rest(app);

describe('/api/dashboard', function() {

  beforeEach(function(done) {
    // Setup the database
    setup.db()
      .then(function() { done(); }, function(err) { done(err); });
  });

  describe('GET /api/group/ID/dashboard', function() {
    it('should return a list of dashboards', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          return group.addDashboard('http://www.example.com')
            .then(function() {
              return group.addDashboard('http://www.example2.com', { timeout: 10 });
            })
            .then(function() {
              request(app)
                .get('/api/group/' + id + '/dashboard')
                .set('Accept', 'application/json')
                .expect(200)
                .expect(function(res) {
                  res.body.length.should.equal(2);
                  res.body[0].should.have.property('url', 'http://www.example.com');
                  res.body[1].should.have.property('url', 'http://www.example2.com');
                  res.body[1].should.have.property('timeout', 10);
                })
                .end(done);
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should 404 when the group doesn\'t exist', function(done) {
      request(app)
        .get('/api/group/123/dashboard')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });

  describe('POST /api/group/ID/dashboard', function() {
    it('should create a new dashboard', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          request(app)
            .post('/api/group/' + id + '/dashboard')
            .send({ url: 'http://www.example.com', timeout: 10 })
            .set('Accept', 'application/json')
            .expect(201)
            .expect(function(res) {
              res.body.should.have.property('url', 'http://www.example.com');
              res.body.should.have.property('timeout', 10);
              group.getDashboards()
                .then(function(dashboards) {
                  dashboards.length.should.equal(1);
                  dashboards[0].toJSON().should.have.property('url', 'http://www.example.com');
                  dashboards[0].toJSON().should.have.property('timeout', 10);
                  done();
                })
                .catch(function(err) { done(err); });
            })
            .end(function(err) {
              if (err) done(err);
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should 404 when the group doesn\'t exist', function(done) {
      request(app)
        .post('/api/group/123/dashboard')
        .send({ url: 'http://www.example.com' })
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });

  describe('PUT /api/group/ID/dashboard/ID', function() {
    it('should modify a dashboard (and its position)', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          return group.addDashboard('http://www.example.com')
            .then(function() {
              return group.addDashboard('http://www.example2.com', { timeout: 10 });
            })
            .then(function(dashboard) {
              request(app)
                .put('/api/group/' + id + '/dashboard/' + dashboard.toJSON().id)
                .send({description: 'my url', rank: 0})
                .set('Accept', 'application/json')
                .expect(200)
                .end(function(err) {
                  if (err) {
                    done(err);
                  } else {
                    group.getDashboards()
                      .then(function(dashboards) {
                        dashboards.length.should.equal(2);
                        dashboards[0].toJSON().should.have.property('url', 'http://www.example2.com');
                        dashboards[0].toJSON().should.have.property('timeout', 10);
                        dashboards[0].toJSON().should.have.property('description', 'my url');
                        dashboards[1].toJSON().should.have.property('url', 'http://www.example.com');
                        done();
                      })
                      .catch(function(err) { done(err); });
                  }
                });
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should 404 when the group doesn\'t exist', function(done) {
      request(app)
        .put('/api/group/123/dashboard/1224')
        .send({ timeout: 34 })
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should 404 when the dashboard doesn\'t exist', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          request(app)
            .del('/api/group/' + id + '/dashboard/1224')
            .send({ timeout: 33 })
            .set('Accept', 'application/json')
            .expect(404, done);
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('DELETE /api/group/ID/dashboard/ID', function() {
    it('should delete a dashboard', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          return group.addDashboard('http://www.example.com')
            .then(function() {
              return group.addDashboard('http://www.example2.com', { timeout: 10 });
            })
            .then(function(dashboard) {
              request(app)
                .del('/api/group/' + id + '/dashboard/' + dashboard.toJSON().id)
                .set('Accept', 'application/json')
                .expect(204)
                .end(function(err) {
                  if (err) {
                    done(err);
                  } else {
                    group.getDashboards()
                      .then(function(dashboards) {
                        dashboards.length.should.equal(1);
                        dashboards[0].toJSON().should.have.property('url', 'http://www.example.com');
                        done();
                      })
                      .catch(function(err) { done(err); });
                  }
                });
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should 404 when the group doesn\'t exist', function(done) {
      request(app)
        .del('/api/group/123/dashboard/1224')
        .set('Accept', 'application/json')
        .expect(404, done);
    });

    it('should 404 when the dashboard doesn\'t exist', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          request(app)
            .del('/api/group/' + id + '/dashboard/1224')
            .set('Accept', 'application/json')
            .expect(404, done);
        })
        .catch(function(err) { done(err); });
    });
  });

});
