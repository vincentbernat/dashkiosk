angular.module('dashkiosk.directives')
  .directive('dkDisplay', function() {
    'use strict';

    return {
      restrict: 'E',
      replace: true,
      scope: {
        display: '=',
        groups: '='
      },
      templateUrl: 'display.html',
      controller: 'DisplayCtrl'
    };
  });
