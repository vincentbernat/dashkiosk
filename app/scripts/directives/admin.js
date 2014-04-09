angular.module('dashkiosk.directives', []);

angular.module('dashkiosk.directives')
  .directive('viewport', function() {
    'use strict';

    var revp = /^\s*\d+\s*([x×]\s*\d+\s*)?$/;
    return {
      require: 'ngModel',
      link: function(scope, elm, attrs, ctrl) {
        ctrl.$parsers.unshift(function(viewValue) {
          if (!viewValue) {
            ctrl.$setValidity('viewport', true);
            return null;
          } else if (revp.test(viewValue)) {
            ctrl.$setValidity('viewport', true);
            return viewValue
              .replace(/\s+/g, '')
              .replace(/×/, 'x');
          } else {
            ctrl.$setValidity('viewport', false);
            return undefined;
          }
        });
      }
    };
  });
