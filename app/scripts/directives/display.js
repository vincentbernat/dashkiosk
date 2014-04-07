angular.module('dashkiosk.directives')
  .directive('dkDisplay', function() {
    'use strict';

    return {
      restrict: 'E',
      replace: true,
      scope: {
        display: '='
      },
      templateUrl: 'display.html',
      controller: 'DisplayCtrl'
    };
  });
