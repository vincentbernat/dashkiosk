angular.module('dashkiosk', ['ngRoute',
                             'ngAnimate',
                             'mgcrea.ngStrap',
                             'xeditable',
                             'dashkiosk.services',
                             'dashkiosk.directives',
                             'dashkiosk.controllers']);

/* Routes. Currently, we only have one. */
angular.module('dashkiosk')
  .config(function($routeProvider) {
    'use strict';

    $routeProvider
      .when('/groups', {
        templateUrl: 'groups.html',
        controller: 'GroupsCtrl',
        resolve: {
          groups: [ 'groupsService',
                    function(groups) { return groups(); } ]
        }
      })
      .otherwise({
        redirectTo: '/groups'
      });
  });

/* Set theme for xeditable */
angular.module('dashkiosk')
  .run(function(editableOptions, editableThemes) {
    'use strict';
    editableThemes.bs3.inputClass = 'input-xs';
    editableThemes.bs3.buttonsClass = 'btn-xs';
    editableOptions.theme = 'bs3';
  });

/* HTTP provider that is able to tell us if we have an HTTP request
   running. The number of pending requests is put into the root
   scope. */
angular.module('dashkiosk')
  .config(function ($httpProvider) {
    'use strict';
    $httpProvider.interceptors.push('requestInterceptor');
  })
  .factory('requestInterceptor', function ($q, loadingIndicatorService) {
    'use strict';
    return {
      'request': function (config) {
        loadingIndicatorService.increment();
        return config || $q.when(config);
      },

      'requestError': function(rejection) {
        loadingIndicatorService.decrement();
        return $q.reject(rejection);
      },

      'response': function(response) {
        loadingIndicatorService.decrement();
        return response || $q.when(response);
      },

      'responseError': function(rejection) {
        loadingIndicatorService.decrement();
        return $q.reject(rejection);
      }
    };
  });
