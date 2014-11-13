angular.module('dashkiosk.controllers')
  .controller('DashboardCtrl', function() {
    'use strict';

  })
  .controller('EditDashboardCtrl', function($scope, $filter, $window) {
    'use strict';

    var realDashboard = $scope.$parent.dashboard,
        copyDashboard = $scope.dashboard = angular.copy(realDashboard || {});
    $scope.submit = function() {
      if (!!realDashboard) {
        // Modification of an existing dashboard
        var modified = _.omit(copyDashboard, function(v, k) {
          if (k[0] === '$') {
            return true;
          }
          if (v === realDashboard[k]) {
            return true;
          }
          return false;
        });
        realDashboard
          .$update(modified)
          .then(function() {
            $scope.$hide();
          });
      } else {
        // Creation of a new dashboard
        $scope.$parent.group.dashboards
          .$add(copyDashboard)
          .then(function() {
            $scope.$hide();
          });
      }
    };

    // Turn the rules into a list of schedules
    function schedules() {
      var later = $window.later;
      later.date.localTime();
      var lines  = (copyDashboard.availability || '').match(/[^\r\n]+/g),
          scheds = _.map(lines, function(line) {
            var sched = later.parse.text('every 1 second ' + line);
            if (sched.error !== -1) {
              return false;
            }
            return later.schedule(sched);
          });

      return _.without(scheds || [], false);
    }

    // Tell if a dashboard is available
    $scope.isAvailable = function() {
      var now = new Date(),
          scheds = schedules();
      if (scheds.length === 0) {
        return true;
      }
      return _.reduce(scheds, function(current, sched) {
        return current || sched.isValid(now);
      }, false);
    };

    // Tell when it will be next available (give a range)
    $scope.nextAvailable = function(available) {
      var scheds = schedules(),
          ranges = _.map(scheds, function(s) { return s.nextRange(); }),
          fmt = 'EEEE, MMMM d, y \'at\' HH:mm';
      if (ranges.length === 0) {
        return null;
      }
      var range = ranges.sort(function(a, b) {
        return a[0] - b[0];
      })[0];
      if (available) {
        /* We are interested in the next availability */
        var from = $filter('date')(range[0], fmt);
        if (range[1]) {
          return from + ' until ' + $filter('date')(range[1], fmt);
        }
        return from;
      }
      /* Next unavailability */
      return $filter('date')(range[1], fmt);
    };

    // Destroy the dashboard.
    $scope.delete = function() {
      realDashboard.$delete();
      $scope.$hide();
    };

    $scope.isNew = function() {
      return !realDashboard;
    };

  });

