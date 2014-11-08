'use strict';

var setup = require('../.');

var should = require('should'),
    models = require('../../lib/models'),
    Promise = require('bluebird');

describe('Dashboard', function() {
  /*jshint expr: true*/

  beforeEach(function(done) {
    // Setup the database
    setup.db()
      .then(function() { done(); }, function(err) { done(err); });
  });

  describe('#isAvailable()', function() {
    it('should mark a dashboard without rules as available', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example.com',
                                    { description: 'Fake example',
                                      timeout: 43 })
            .then(function(dashboard) {
              dashboard.isAvailable(new Date('2014-11-08T16:39:47')).should.be.true;
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should mark a dashboard with empty rules as available', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example.com',
                                    { description: 'Fake example',
                                      timeout: 43,
                                      availability: '# Comment\n# Another comment\n\n\n' })
            .then(function(dashboard) {
              dashboard.isAvailable(new Date('2014-11-08T16:39:47')).should.be.true;
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should check availability with one rule', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example.com',
                                    { description: 'Fake example',
                                      timeout: 43,
                                      availability: 'of december' })
            .then(function(dashboard) {
              dashboard.isAvailable(new Date('2014-11-08T16:39:47')).should.be.false;
              dashboard.isAvailable(new Date('2015-11-08T16:39:47')).should.be.false;
              dashboard.isAvailable(new Date('2014-12-08T16:39:47')).should.be.true;
              dashboard.isAvailable(new Date('2015-12-08T16:39:47')).should.be.true;
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

    it('should check availability with several rules', function(done) {
      var g = new models.Group('test group');
      g.create()
        .then(function(group) {
          return group.addDashboard('http://www.example.com',
                                    { description: 'Fake example',
                                      timeout: 43,
                                      availability: 'every 1 day of december\nin 2015' })
            .then(function(dashboard) {
              dashboard.isAvailable(new Date('2014-11-08T16:39:47')).should.be.false;
              dashboard.isAvailable(new Date('2015-11-08T16:39:47')).should.be.true;
              dashboard.isAvailable(new Date('2014-12-08T16:39:47')).should.be.true;
              dashboard.isAvailable(new Date('2015-12-08T16:39:47')).should.be.true;
              done();
            });
        })
        .catch(function(err) { done(err); });
    });

  });

});
