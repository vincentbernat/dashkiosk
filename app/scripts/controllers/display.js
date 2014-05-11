/*jshint bitwise: false*/
angular.module('dashkiosk.controllers')
  .controller('DisplayCtrl', function($scope) {
    'use strict';

    // We choose an appropriate background offset for each group such
    // that all displays of the same group seem to have the same image
    // but each group have a different image. Moreover, we want that
    // to change depending on the selected dashboard.
    $scope.backgroundOffset = function() {
      if (!$scope.display.connected) {
        return '0 0';
      }
      var g = $scope.display.group,
          d = (_.find($scope.groups[g].dashboards,
                      { active: true }) || {}).id || -1;
      // Ok, from g and d, we want to have two offsets.
      var mw = g + 1, mz = d + 1, i;
      for (i = 0; i < 4; i++) {
        mz = 36969 * (mz & 65535) + (mz >>> 16);
        mw = 18000 * (mw & 65535) + (mw >>> 16);
      }
      var r = (mz << 16) + mw;
      return '-' + ((r & 65535) % 100) + '% -' + ((r >>> 16) % 100) + '%';
    };

  })
  .controller('EditDisplayCtrl', function($scope, $q) {
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

      var deferred = $q.defer(),
          promise = deferred.promise;
      if (!_.isEmpty(_.omit(modified, 'group'))) {
        promise.then(function() {
          return realDisplay.$update(_.omit(modified, 'group'));
        });
      }
      if (_.has(modified, 'group')) {
        promise.then(function() {
          return $scope.groups[modified.group].$attach(realDisplay.name);
        });
      }
      promise.then(function() {
        $scope.$hide();
      });
      deferred.resolve(true);
      return promise;
    };

    // Destroy the display
    $scope.delete = function() {
      $scope.$hide();
      realDisplay.$delete();
    };

  });
