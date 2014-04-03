'use strict';

var setup = require('../.');

var should = require('should'),
    assert = require('assert'),
    models = require('../../lib/models');

function fail(err) {
  assert.fail(err);
}

describe('Display', function() {

  beforeEach(function(done) {
    // Setup the database
    setup.db()
      .then(function() { done(); }, fail);
  });

  describe('#register()', function() {
    it('should create a new display', function(done) {
      models.Display.register()
        .then(function(display) {
          var name = display.toJSON().name;
          name.should.have.length(6);
          return models.Display.get(name)
            .then(function(display) {
              display.toJSON().name.should.equal(name);
              done();
            }, fail);
        }, fail);
    });

    it('should create a new display on unknown name', function(done) {
      models.Display.register('NOTAVALIDNAME')
        .then(function(display) {
          var name = display.toJSON().name;
          name.should.have.length(6);
          name.should.not.be.equal('NOTVALIDNAME');
          done();
        });
    });

    it('should accept a returning display', function(done) {
      models.Display.register()
        .then(function(display) {
          var name = display.toJSON().name;
          return models.Display.register(name)
            .then(function(display) {
              display.toJSON().name.should.equal(name);
              return models.Display.all()
                .then(function(displays) {
                  displays[name].should.not.equal(undefined);
                  done();
                }, fail);
            }, fail);
        }, fail);
    });

    it('should be associated to the unassigned group', function(done) {
      models.Display.register()
        .then(function(display) {
          return models.Group.get(display.toJSON().group);
        }, fail)
        .then(function(group) {
          group.toJSON().name.should.equal('unassigned');
          done();
        }, fail);
    });

  });

  describe('#setGroup()', function() {
    it('should assign a group to a display', function(done) {
      models.Display.register()
        .then(function(display) {
          var name = display.toJSON().name;
          var group = new models.Group('test group');
          return group.create()
            .then(function(group) {
              return display.setGroup(group)
                .then(function() {
                  return models.Display.register(name);
                }, fail)
                .then(function(display) {
                  display.toJSON().name.should.equal(name);
                  display.toJSON().group.should.equal(group.toJSON().id);
                  done();
                }, fail);
            }, fail);
        }, fail);
    });
  });

});
