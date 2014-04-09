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

    var groups = { server: {}, client: {} };

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
        // This is a convenient way to only apply changes.
        DeepDiff.applyDiff(groups.client, groups.server);
        groups.client = new GroupCollection(groups.client);
        console.debug('[Dashkiosk] current view', groups.client);
      });
      if (deferred !== null) {
        // Give the result to people waiting. We are now ready.
        deferred.resolve(groups.client);
        deferred = null;
        ready = true;
      }
    }

    // Collection of groups
    function GroupCollection(data) {
      var self = (data instanceof GroupCollection)?data:_.extend(this, data);
      _.forOwn(self, function(v, k) {
        self[k] = new Group(v);
      }, self);
      return self;
    }
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
      var self = (data instanceof Group)?data:_.extend(this, data);
      self.displays = _.mapValues(self.displays, function(d) { return new Display(d); });
      self.dashboards = new DashboardCollection(self.dashboards, self);
      return self;
    }
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
      var self = (data instanceof Display)?data:_.extend(this, data);
      return self;
    }
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
    Display.prototype.$osd = function() {
      return this.$action({action: 'osd',
                           text: (this.osd?null:this.name)});
    };

    // Collection of dashboards. This should be mostly
    // indistinguishable from an array.
    function DashboardCollection(data, group) {
      var self;
      if (data.$add) {
        self = data;
      } else {
        self = [];
        self.push.apply(self, data);
        self.$add = DashboardCollection.prototype.$add;
        Object.defineProperty(self, '$add', {
          enumerable: false,
          writable: false
        });
      }
      self.group = group;
      Object.defineProperty(self, 'group', {
        enumerable: false,
        writable: true
      });
      _.forOwn(self, function(v, k) {
        self[k] = new Dashboard(v, group);
      }, self);
      return self;
    }
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
      var self = (data instanceof Dashboard)?data:_.extend(this, data);
      self.group = group;
      Object.defineProperty(self, 'group', {
        enumerable: false,
        writable: true
      });
      return self;
    }
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
