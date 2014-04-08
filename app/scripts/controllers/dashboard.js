angular.module('dashkiosk.controllers')
  .controller('DashboardCtrl', function() {
    'use strict';

  })
  .controller('EditDashboardCtrl', function($scope) {
    'use strict';

    var realDashboard = $scope.$parent.dashboard,
        copyDashboard = $scope.dashboard = angular.copy(realDashboard);
    $scope.submit = function() {
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
    };

    // Destroy the dashboard.
    $scope.delete = function() {
      realDashboard.$delete();
      $scope.$hide();
    };

  });

