angular.module('dashkiosk.controllers')
  .controller('GroupCtrl', function($scope) {
    'use strict';

    $scope.attachDisplay = function(name) {
      $scope.group.$attach(name);
    };
  });
