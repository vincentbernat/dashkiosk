angular.module('dashkiosk.controllers')
  .controller('DashboardCtrl', function() {
    'use strict';

  })
  .controller('EditDashboardCtrl', function($scope) {
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

    // Destroy the dashboard.
    $scope.delete = function() {
      realDashboard.$delete();
      $scope.$hide();
    };

    $scope.isNew = function() {
      return !realDashboard;
    };

  });

