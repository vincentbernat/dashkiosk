angular.module('dashkiosk.controllers')
  .controller('GroupsCtrl', function($scope, groups) {
    'use strict';

    $scope.groups = groups;

  });
