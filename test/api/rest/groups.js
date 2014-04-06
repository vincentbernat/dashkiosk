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

describe('/api/group', function() {

  beforeEach(function(done) {
    // Setup the database
    setup.db()
      .then(function() { done(); }, function(err) { done(err); });
  });

  describe('GET /api/group', function() {
    it('should return an empty list', function(done) {
      request(app)
        .get('/api/group')
        .set('Accept', 'application/json')
        .expect(function(res) {
          res.should.have.status(200);
          JSON.parse(res.text).should.eql({});
        })
        .end(done);
    });

    it('should return a set of groups', function(done) {
      var g = new models.Group('test group', { description: 'my new group' });
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          request(app)
            .get('/api/group')
            .set('Accept', 'application/json')
            .expect(function(res) {
              res.should.have.status(200);
              res.body[id].should.have.property('name', 'test group');
              res.body[id].should.have.property('description', 'my new group');
            })
            .end(done);
        })
        .catch(function(err) { done(err); });
    });
  });

  describe('POST /api/group', function() {
    it('should create a new group', function(done) {
      request(app)
        .post('/api/group')
        .send({ name: 'test group',
                description: 'my new group',
                invalid: 'nothing' })
        .set('Accept', 'application/json')
        .end(function(err, res) {
          if (err) {
            done(err);
          } else {
            var id = res.body.id;
            res.should.have.status(201);
            res.body.should.have.property('id');
            res.body.should.have.property('name', 'test group');
            res.body.should.have.property('description', 'my new group');
            res.body.should.not.have.property('invalid');
            models.Group.get(id)
              .then(function(group) {
                group.toJSON().name.should.equal('test group');
                group.toJSON().description.should.equal('my new group');
                group.toJSON().should.not.have.property('invalid');
                done();
              })
              .catch(function(err) { done(err); });
          }
        });
    });

    it('should not create a group with the same name', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          request(app)
            .post('/api/group')
            .send({ name: 'test group' })
            .set('Accept', 'application/json')
            .expect(409, done);
        })
        .catch(function(err) { done(err); });
    });

    it('should require a name', function(done) {
      request(app)
        .post('/api/group')
        .send({ description: 'my new group' })
        .set('Accept', 'application/json')
        .expect(400, done);
    });

  });

  describe('PUT /api/group', function() {
    it('should modify an existing group', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          request(app)
            .put('/api/group/' + id)
            .send({ description: 'my test group' })
            .set('Accept', 'application/json')
            .end(function(err, res) {
              if (err) {
                done(err);
              } else {
                models.Group.get(id)
                  .then(function(group) {
                    group.toJSON().description.should.equal('my test group');
                    group.toJSON().name.should.equal('test group');
                    done();
                  })
                  .catch(function(err) { done(err); });
              }
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should 404 when the group doesn\'t exist', function(done) {
      request(app)
        .put('/api/group/12')
        .send({ description: 'my test group' })
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });

  describe('DELETE /api/group', function() {
    it('should delete an existing group', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          var id = group.toJSON().id;
          request(app)
            .del('/api/group/' + id)
            .set('Accept', 'application/json')
            .expect(204)
            .end(function(err, res) {
              if (err) {
                done(err);
              } else {
                models.Group.get(id)
                  .then(function() {
                    done(new Error('should not exist anymore'));
                  }, function() { done(); });
              }
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should 404 when the group doesn\'t exist', function(done) {
      request(app)
        .del('/api/group/12')
        .set('Accept', 'application/json')
        .expect(404, done);
    });
  });

});
