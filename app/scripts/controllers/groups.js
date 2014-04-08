angular.module('dashkiosk.controllers')
  .controller('GroupsCtrl', function($scope, groups) {
    'use strict';

    $scope.groups = groups;
    $scope.createGroup = function() {
      var random = (function(length) {
        var bits = 36,
            tmp,
            out = '';
        while (out.length < length) {
          tmp = Math.random().toString(bits).slice(2);
          out += tmp.slice(0, Math.min(tmp.length, (length - out.length)));
        }
        return out.toUpperCase();
      })(6);
      groups.$add({ name: 'New group ' + random,
                    description: 'Newly created group' });
    };

  });
