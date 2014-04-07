angular.module('dashkiosk.directives')
  .directive('dkGroup', function() {
    'use strict';

    return {
      restrict: 'E',
      replace: true,
      scope: {
        group: '='
      },
      templateUrl: 'group.html',
      controller: 'GroupCtrl'
    };
  });
