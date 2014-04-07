angular.module('dashkiosk.directives')
  .directive('dkAlerts', function(alertService) {
    'use strict';

    return {
      restrict: 'E',
      replace: true,
      templateUrl: 'alerts.html',
      controller: function($scope) {
        $scope.alerts = alertService.alerts;
        $scope.close = function(idx) {
          alertService.close(idx);
        };
      }
    };
  });
