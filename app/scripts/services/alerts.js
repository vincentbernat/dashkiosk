angular.module('dashkiosk.services')
  .factory('alertService', function() {
    'use strict';

    var alerts = [],
        levels = [ 'danger', 'warning', 'success', 'info' ];
    function add(level, title, message) {
      if (message === undefined) {
        message = title;
        title = undefined;
      }
      alerts.push({ level: level,
                    title: title,
                    message: message });
    }
    function close(index) {
      alerts.splice(index, 1);
    }

    var o = _.object(levels,
                     _.map(levels,
                           function(level) { return function(title, message) { add(level, title, message); }; }));
    o.close = close;
    o.alerts = alerts;
    return o;
  });
