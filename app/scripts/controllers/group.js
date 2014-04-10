angular.module('dashkiosk.controllers')
  .controller('GroupCtrl', function($scope) {
    'use strict';

    $scope.attachDisplay = function(name) {
      $scope.group.$attach(name);
    };

    // Return true if any display in the group is connected
    $scope.anyConnected = function() {
      return _.any($scope.group.displays, function(d) {
        return d.connected;
      });
    };

    // Reload any connected display in the group
    $scope.reload = function() {
      _.each($scope.group.displays, function(d) {
        if (d.connected) {
          d.$reload();
        }
      });
    };

    // Return true if all connected displays have the OSD enabled
    $scope.allOsd = function() {
      return _.all($scope.group.displays, function(d) {
        return !d.connected || d.osd;
      });
    };

    // Toggle OSD on any connected displayin the group
    $scope.toggleOsd = function() {
      var off = $scope.allOsd();
      _.each($scope.group.displays, function(d) {
        if (d.connected) {
          d.$osd(!off);
        }
      });
    };

  });
