angular.module('dashkiosk.controllers')
  .controller('DisplayCtrl', function() {
    'use strict';

  })
  .controller('EditDisplayCtrl', function($scope) {
    'use strict';

    var realDisplay = $scope.$parent.display,
        copyDisplay = $scope.display = angular.copy(realDisplay);
    $scope.submit = function() {
      var modified = _.omit(copyDisplay, function(v, k) {
        if (k[0] === '$') {
          return true;
        }
        if (v === realDisplay[k]) {
          return true;
        }
        return false;
      });
      realDisplay
        .$update(modified)
        .then(function() {
          $scope.$hide();
        });
    };

    // Destroy the display
    $scope.delete = function() {
      realDisplay.$delete();
      $scope.$hide();
    };

  });
