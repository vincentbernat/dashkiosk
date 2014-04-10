// Handle persistence of the groups to and from the server. When new
// data arrive from server, the model is updated at once. However, the
// model can only be updated to the server through the use of
// dedicated functions.

angular.module('dashkiosk.services')
  .factory('groupsService', function($window, $q, $http, $rootScope, loadingIndicatorService, alertService) {
    'use strict';
    var io = $window.io,
        socket = io.connect($window.location.origin + '/changes'),
        deferred = null,        // Will resolve once we get data for the first time
        ready = false;

    var groups = { server: {} };

    loadingIndicatorService.increment();
    socket.on('connect', function() {
      console.info('[Dashkiosk] connected to socket.io server');
      socket.once('snapshot', function() {
        loadingIndicatorService.decrement();
      });
    });
    socket.on('disconnect', function() {
      console.warn('[Dashkiosk] lost connection to socket.io server');
      loadingIndicatorService.increment();
    });

    // Full update
    socket.on('snapshot', function(newGroups) {
      console.info('[Dashkiosk] received a full snapshot of all groups');
      groups.server = newGroups;
      fromServer();
    });

    // Incremental updates
    socket.on('group.created', function(group) {
      console.info('[Dashkiosk] received a new group', group);
      groups.server[group.id] = group;
      fromServer();
    });
    socket.on('group.updated', function(group) {
      console.info('[Dashkiosk] updated group', group);
      groups.server[group.id] = group;
      fromServer();
    });
    socket.on('group.deleted', function(group) {
      console.info('[Dashkiosk] deleted group', group);
      delete groups.server[group.id];
      fromServer();
    });
    socket.on('display.updated', function(display) {
      console.info('[Dashkiosk] updated display', display);
      // Remove the display from any existing group
      _.each(groups.server, function(group) {
        group.displays = _.omit(group.displays, function(d) { return d.name === display.name; });
      });
      // Add it back to the right group
      var group = groups.server[display.group];
      if (group) {
        group.displays[display.name] = display;
      }
      fromServer();
    });
    socket.on('display.deleted', function(display) {
      console.debug('[Dashkiosk] deleted display', display);
      _.each(groups.server, function(group) {
        group.displays = _.omit(group.displays, function(d) { return d.name === display.name; });
      });
      fromServer();
    });

    // Update client version of the data. We just apply any diff that
    // comes from the server.
    function fromServer() {
      // Start a digest cycle.
      $rootScope.$apply(function() {
        groups.client.applyDiff(groups.server);
        console.debug('[Dashkiosk] current view', groups.client);
      });
      if (deferred !== null) {
        // Give the result to people waiting. We are now ready.
        deferred.resolve(groups.client);
        deferred = null;
        ready = true;
      }
    }

    function diff(a, b, fnOnlyA, fnOnlyB, fnBoth, thisArg) {
      var kA = _.keys(a),
          kB = _.keys(b),
          onlyA = _.difference(kA, kB),
          onlyB = _.difference(kB, kA),
          both = _.intersection(kA, kB);
      _.each(onlyA, fnOnlyA, thisArg);
      _.each(onlyB, fnOnlyB, thisArg);
      _.each(both, fnBoth, thisArg);
    }

    // Collection of groups
    function GroupCollection() {
    }
    GroupCollection.prototype.applyDiff = function(data) {
      var self = this;
      diff(self, data,
           function(k) { delete self[k]; },
           function(k) { self[k] = new Group(data[k]); },
           function(k) { self[k].applyDiff(data[k]); });
    };
    // Add a new group
    GroupCollection.prototype.$add = function(params) {
      return $http
        .post('api/group', params)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to create new group!',
                              ((err || {}).data || {}).message);
          return false;
        });
    };

    // One group
    function Group(data) {
      _.extend(this, data);
      this.displays = _.mapValues(this.displays, function(d) { return new Display(d); });
      this.dashboards = new DashboardCollection(this.dashboards, this);
    }
    Group.prototype.applyDiff = function(data) {
      var self = this;
      diff(_.omit(self, ['displays', 'dashboards']),
           _.omit(data, ['displays', 'dashboards']),
           function(k) { delete self[k]; },
           function(k) { self[k] = data[k]; },
           function(k) { self[k] = data[k]; });
      self.dashboards.applyDiff(data.dashboards);
      diff(self.displays, data.displays,
           function(k) { delete self.displays[k]; },
           function(k) { self.displays[k] = new Display(data.displays[k]); },
           function(k) { self.displays[k].applyDiff(data.displays[k]); });
    };
    // Update a group parameters
    Group.prototype.$update = function(params) {
      return $http
        .put('api/group/' + this.id, params)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to update group!',
                              ((err || {}).data || {}).message);
          return false;
        });
    };
    // Delete a group
    Group.prototype.$delete = function() {
      return $http
        .delete('api/group/' + this.id)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to delete group!',
                              ((err || {}).data || {}).message);
          return false;
        });
    };
    // Attach a display
    Group.prototype.$attach = function(name) {
      return $http
        .put('api/display/' + name + '/group/' + this.id)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to attach display!',
                              ((err || {}).data || {}).message);
          return false;
        });
    };
    // Check if the group is empty (not any display attached)
    Group.prototype.$empty = function() {
      return _.keys(this.displays).length === 0;
    };

    // One display
    function Display(data) {
      _.extend(this, data);
    }
    Display.prototype.applyDiff = function(data) {
      var self = this;
      diff(self, data,
           function(k) { delete self[k]; },
           function(k) { self[k] = data[k]; },
           function(k) { self[k] = data[k]; });
    };
    Display.prototype.$update = function(params) {
      return $http
        .put('api/display/' + this.name, params)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to update display!',
                              ((err || {}).data || {}).message);
          return false;
        });
    };
    Display.prototype.$delete = function() {
      return $http
        .delete('api/display/' + this.name)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to delete display!',
                              ((err || {}).data || {}).message);
          return false;
        });
    };
    Display.prototype.$action = function(params) {
      return $http
        .post('api/display/' + this.name + '/action', params)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to trigger display action!',
                              ((err || {}).data || {}).message);
          return false;
        });
    };
    Display.prototype.$reload = function() {
      return this.$action({action: 'reload'});
    };
    Display.prototype.$osd = function(enable) {
      return this.$action({action: 'osd',
                           text: ((enable === true)?this.name:
                                  (enable === false)?null:
                                  this.osd?null:
                                  this.name)});
    };

    // Collection of dashboards. This should be mostly
    // indistinguishable from an array.
    function DashboardCollection(data, group) {
      var self = [];
      self.$add = DashboardCollection.prototype.$add;
      Object.defineProperty(self, '$add', {
        enumerable: false,
        writable: false
      });
      self.applyDiff = DashboardCollection.prototype.applyDiff;
      Object.defineProperty(self, 'applydiff', {
        enumerable: false,
        writable: false
      });
      self.group = group;
      Object.defineProperty(self, 'group', {
        enumerable: false,
        writable: true
      });
      self.push.apply(self, _.map(data, function(d) {
        return new Dashboard(d, group);
      }));
      return self;
    }
    DashboardCollection.prototype.applyDiff = function(data) {
      var self = this;
      _.each(data, function(d, i) {
        var idx = _.findIndex(self, { 'id': d.id });
        if (idx === -1) {
          self.splice(i, 0, new Dashboard(d, self.group));
        } else {
          if (idx !== i) {
            self.splice(i, 0, self.splice(idx, 1)[0]);
          }
          self[i].applyDiff(d);
        }
      });
      self.splice(data.length); // remove extra elements
    };
    DashboardCollection.prototype.$add = function(params) {
      return $http
        .post('api/group/' + this.group.id + '/dashboard', params)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to create new dashboard',
                              ((err || {}).data || {}).message);
          return false;
        });
    };

    // One dashboard
    function Dashboard(data, group) {
      var self = _.extend(this, data);
      self.group = group;
      Object.defineProperty(self, 'group', {
        enumerable: false,
        writable: true
      });
      return self;
    }
    Dashboard.prototype.applyDiff = function(data) {
      var self = this;
      diff(self, _.omit(data, 'group'),
           function(k) { delete self[k]; },
           function(k) { self[k] = data[k]; },
           function(k) { self[k] = data[k]; });
    };
    Dashboard.prototype.$delete = function() {
      return $http
        .delete('api/group/' + this.group.id + '/dashboard/' + this.id)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to delete dashboard',
                              ((err || {}).data || {}).message);
          return false;
        });
    };
    Dashboard.prototype.$update = function(params) {
      return $http
        .put('api/group/' + this.group.id + '/dashboard/' + this.id, params)
        .then(function() { return false; })
        .catch(function(err) {
          alertService.danger('Unable to update dashboard',
                              ((err || {}).data || {}).message);
          return false;
        });
    };

    groups.client = new GroupCollection();

    return function() {
      if (ready) {
        return groups.client;
      }
      if (deferred === null) {
        deferred = $q.defer();
      }
      return deferred.promise;
    };
  });
