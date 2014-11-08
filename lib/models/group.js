'use strict';

var _  = require('lodash'),
    util = require('util'),
    logger = require('../logger'),
    db = require('../db'),
    models = require('../models'),
    bus = require('../bus');

// Constructor. Also, name can be an existing DAO instance.
function Group(name, params) {
  if (name instanceof db.Group.DAO) {
    this.persistent = name;
  } else {
    params = params || {};
    this.persistent = db.Group.build({
      name: name,
      description: params.description
    });
  }
}
util.inherits(Group, models.Model);

// Create a new group. We check before creation to get a meaningful
// message
Group.prototype.create = function() {
  var self = this;
  return db.Group.findOrCreate({ name: this.persistent.name },
                               this.persistent.values)
    .spread(function(group, created) {
      if (!created) {
        throw new models.ConflictError('A group with the same name already exists.');
      }
      self.persistent = group;
      bus.publish('group.' + self.persistent.id +
                  '.created', { group: self });
      return self.start();
    })
    .then(function() {
      return self;
    });
};

// Delete a group
Group.prototype.delete = function() {
  var self = this;
  return this.persistent.getDisplays()
    .then(function(displays) {
      if (displays.length) {
        throw new models.ConflictError('A group with displays attached cannot be deleted.');
      }
      return self.stop();
    })
    .then(function() {
      return self.persistent.destroy()
        .then(function() {
          bus.publish('group.' + self.persistent.id +
                      '.deleted', { group: self });
          return self;
        });
    });
};

// Update
Group.prototype.update = function(params) {
  var self = this;
  var start;
  if (params.name && params.name !== this.persistent.name) {
    // We want to check if we already have a group with the same name
    // and provide the user with a clearer message
    start = db.Group.find({where: {name: params.name}})
      .then(function(group) {
        if (group) {
          throw new models.ConflictError('A group with the same name already exists.');
        }
        return self.persistent.updateAttributes(params);
      });
  } else {
    start = this.persistent.updateAttributes(params);
  }
  return start
    .then(function() {
      bus.publish('group.' + self.persistent.id +
                  '.updated', { group: self });
      return self;
    });
};

// Get displays attached to a group
Group.prototype.getDisplays = function() {
  return this.persistent.getDisplays()
    .then(function(displays) {
      return _.object(_.pluck(displays, 'name'),
                      _.map(displays, function(d) { return new models.Display(d); }));
    });
};

// Get dashboards from a group
Group.prototype.getDashboards = function() {
  return this.persistent.getDashboards({order: [['rank', 'ASC'],
                                                ['id', 'ASC']] })
    .then(function(dashboards) {
      return _.map(dashboards, function(d) { return new models.Dashboard(d); });
    });
};

// Get one dashboard
Group.prototype.getDashboard = function(id) {
  return this.persistent.getDashboards({ where: { id: id }})
    .then(function(dashboards) {
      if (dashboards.length === 0) {
        throw new models.NotFoundError('No dashboard with ID ' + id + ' exists.');
      }
      return new models.Dashboard(dashboards[0]);
    });
};

// Add a dashboard to a group
Group.prototype.addDashboard = function(url, params) {
  var self = this;
  var dashboard = new models.Dashboard(url, params);
  return dashboard.create()
    .then(function(dashboard) {
      return self.persistent.addDashboard(dashboard.persistent)
        .then(function() { return dashboard; });
    })
    .then(function(dashboard) {
      return self.moveDashboard(dashboard, 10000);
    })
    .then(function(dashboard) {
      bus.publish('group.' + self.persistent.id +
                  '.dashboard.' + dashboard.toJSON().id +
                  '.added', { group: self,
                              dashboard: dashboard });
      return dashboard;
    });
};

// Delete a dashboard
Group.prototype.deleteDashboard = function(dashboard) {
  var self = this;
  return dashboard.delete()
    .then(function(dashboard) {
      bus.publish('group.' + self.persistent.id +
                  '.dashboard.' + dashboard.toJSON().id +
                  '.removed', { group: self,
                                dashboard: dashboard });
      return dashboard;
    });
};

Group.prototype.updateDashboard = function(dashboard, params) {
  var self = this;
  return dashboard.update(params)
    .then(function(dashboard) {
      bus.publish('group.' + self.persistent.id +
                  '.dashboard.' + dashboard.toJSON().id +
                  '.updated', { group: self,
                                dashboard: dashboard });
      return dashboard;
    });
};


// Move a dashboard to a different position
Group.prototype.moveDashboard = function(dashboard, position) {
  var self = this;
  return this.persistent.fixRanking()
    .then(function() {
      return dashboard.persistent.reload();
    })
    .then(function(dashboard) {
      var current = (dashboard.rank - 1) / 2;
      if (current < position) {
        position = position * 2 + 2;
      } else {
        position = position * 2;
      }
      return dashboard.updateAttributes({rank: position});
    })
    .then(function(dashboard) {
      dashboard = new models.Dashboard(dashboard);
      bus.publish('group.' + self.persistent.id +
                  '.dashboard.' + dashboard.toJSON().id +
                  '.updated', { group: self,
                                dashboard: dashboard });
      return dashboard;
    });
};

// Display the given dashboard
Group.prototype.displayDashboard = function(dashboard) {
  bus.publish('group.' + this.persistent.id + '.dashboard',
              { group: this, dashboard: dashboard });
};

// Handle FSM for a group of dashboards
(function() {

  var running = {};  // We store here any information that we have to
                     // share between instances. We cannot store
                     // anything in this as we may have two different
                     // instances of the same group.

  Group.prototype.start = function() {
    if (this.isRunning()) {
      logger.debug('group FSM is already running', this.toJSON());
      return undefined;
    }

    var self = this;
    var storage = running[this.persistent.id] = {
      currentDashboard: null,
      subscriptions: [],
      timer: null
    };

    // Display the current dashboard
    function display() {
      var dashboard = storage.currentDashboard.toJSON();
      if (storage.timer !== null) {
        clearTimeout(storage.timer);
      }
      if (dashboard.timeout && dashboard.timeout > 0) {
        storage.timer = setTimeout(next, dashboard.timeout * 1000);
      }
      self.displayDashboard(storage.currentDashboard);
    }

    // Display the next dashboard
    function next(now) {
      var current = (storage.currentDashboard &&
                     storage.currentDashboard.getRank()) || 0;
      self.getDashboards()
        .then(function(dashboards) {
          if (dashboards.length === 0) {
            logger.warn('empty group', {
              group: self.toJSON()
            });
            storage.currentDashboard = null;
            return;
          }

          var current = -1,
              i = 0,
              now = now || new Date(); // Use the same date to do
                                       // compute availability
                                       // (avoiding any race condition).
          if (storage.currentDashboard) {
            current = _.findIndex(dashboards, function(d) {
              return d.toJSON().id === storage.currentDashboard.toJSON().id;
            });
          }

          do {
            storage.currentDashboard = dashboards[++current] || dashboards[current = 0];
          } while (!storage.currentDashboard.isAvailable(now) &&
                   ++i < dashboards.length);
          if (i === dashboards.length) {
            logger.warn('no dashboard can be currently displayed in this group',
                        { group: self.toJSON() });
            storage.currentDashboard = null;
            return;
          }
          display();
        });
    }

    var handle = {

      // When a new display connects, sends the current dashboard
      newMember: function(data) {
        var display = data.display,
            group = display && display.toJSON().group;
        if (display &&
            storage.currentDashboard &&
            group === self.persistent.id) {
          bus.publish('display.' + display.toJSON().name + '.dashboard',
                      { dashboard: storage.currentDashboard });
        }
      },

      // When a dashboard is inserted into the current group. Currently,
      // we only do something if we have nothing to display.
      addDashboard: function(data) {
        var dashboard = data.dashboard;
        if (!storage.currentDashboard) {
          next();
        }
      },

      // A dashboard has been removed, we only do something if this the current one
      removeDashboard: function(data) {
        var dashboard = data.dashboard;
        if (storage.currentDashboard &&
            dashboard &&
            dashboard.toJSON().id === storage.currentDashboard.toJSON().id) {
          storage.currentDashboard = null;
          next();
        }
      },

      // A dashboard has been updated. We only do something if this
      // the current one
      updateDashboard: function(data) {
        var dashboard = data.dashboard;
        if (storage.currentDashboard &&
            dashboard &&
            dashboard.toJSON().id === storage.currentDashboard.toJSON().id) {
          if (_.omit(storage.currentDashboard.toJSON(), [ 'rank', 'description' ]) !==
              _.omit(dashboard.toJSON(), [ 'rank', 'description' ])) {
            logger.info('updated dashboard, refresh', { dashboard: dashboard });
            storage.currentDashboard = dashboard;
            display();
          }
        }
      },

      // Refresh the model when a modification happens
      updateGroup: function(data) {
        self.persistent = data.group.persistent;
      }

    };

    _.extend(storage.subscriptions, [
      bus.subscribe('display.*.connected', handle.newMember),
      bus.subscribe('display.*.group', handle.newMember),
      bus.subscribe('group.' + self.persistent.id + '.dashboard.*.added', handle.addDashboard),
      bus.subscribe('group.' + self.persistent.id + '.dashboard.*.removed', handle.removeDashboard),
      bus.subscribe('group.' + self.persistent.id + '.dashboard.*.updated', handle.updateDashboard),
      bus.subscribe('group.' + self.persistent.id + '.updated', handle.updateGroup)
    ]);

    // Display the first dashboard
    logger.info('starting group', this.toJSON());
    return next();
  };

  Group.prototype.stop = function() {
    logger.info('stopping group', this.toJSON());
    var storage = running[this.persistent.id];
    _.each(storage.subscriptions, function(s) {
      s.unsubscribe();
    });
    if (storage.timer !== null) {
      clearTimeout(storage.timer);
    }
    delete running[this.persistent.id];
  };

  Group.prototype.isRunning = function() {
    return (this.persistent.id in running);
  };

  Group.prototype.getCurrentDashboard = function() {
    return (running[this.persistent.id] || {}).currentDashboard;
  };

})();

// Start FSM for all existing dashboards
Group.run = function() {
  return Group.all()
    .then(function(groups) {
      return _.map(groups, function(group) { return group.start(); });
    })
    .all();
};


// Get a group by ID
Group.get = function(id) {
  return db.Group.find({ where: { id: id } })
    .then(function(group) {
      if (!group) {
        throw new models.NotFoundError('No group with ID ' + id + ' exists.');
      }
      return new Group(group);
    });
};

// Get all groups
Group.all = function() {
  return db.Group.findAll()
    .then(function(groups) {
      return _.object(_.pluck(groups, 'id'),
                      _.map(groups, function(g) { return new Group(g); }));
    });
};

// Get the special unassigned group. We return the same promise to everyone.
Group.unassigned = (function() {
  var promise = null;
  return function() {
    if (promise === null) {
      promise = db.Group.findOrCreate({ name: 'Unassigned' },
                                      { description: 'Default group for unassigned displays' })
        .spread(function(unassigned, created) {
          unassigned = new Group(unassigned);
          if (created) {
            return unassigned
              .addDashboard('/unassigned',
                            { description: 'Dashboards for unassigned display' })
              .then(function() {
                bus.publish('group.' + unassigned.persistent.id +
                            '.created', { group: unassigned });
                return unassigned.start();
              })
              .then(function() {
                promise = null;
                return unassigned;
              });
          } else {
            promise = null;
            return unassigned;
          }
        });
    }
    return promise;
  };
})();

// Get the special chromecast group. We return the same promise to everyone.
Group.chromecast = (function() {
  var promise = null;
  return function() {
    if (promise === null) {
      promise = db.Group.findOrCreate({ name: 'Chromecast devices' },
                                      { description: 'Default group for discovered Chromecast devices' })
        .spread(function(chromecast, created) {
          chromecast = new Group(chromecast);
          if (created) {
            bus.publish('group.' + chromecast.persistent.id +
                        '.created', { group: chromecast });
          }
          promise = null;
          return chromecast;
        });
    }
    return promise;
  };
})();

module.exports = Group;
