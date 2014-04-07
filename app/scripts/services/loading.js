angular.module('dashkiosk.services')
  .factory('loadingIndicatorService', function($timeout) {
    'use strict';

    var current = 0;

    return {
      increment: function() {
        // Like a "safe" $apply
        $timeout(function() {
          current += 1;
        }, 0);
      },
      decrement: function() {
        $timeout(function() {
          current -= 1;
        }, 0);
      },
      isBusy: function() { return (current > 0); }
    };
  });
