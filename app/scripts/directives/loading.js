angular.module('dashkiosk.directives')
  .directive('dkLoadingIndicator', function(loadingIndicatorService) {
    'use strict';

    return {
      restrict: 'E',
      replace: true,
      transclude: true,
      templateUrl: 'loading.html',
      controller: function($scope) {
        $scope.isBusy = loadingIndicatorService.isBusy;
      }
    };
  });
