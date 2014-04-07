angular.module('dashkiosk.directives')
  .directive('dkDashboard', function() {
    'use strict';

    return {
      restrict: 'E',
      replace: true,
      scope: {
        dashboard: '='
      },
      templateUrl: 'dashboard.html',
      controller: 'DashboardCtrl'
    };
  });
