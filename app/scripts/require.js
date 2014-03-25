/* Very simple registry */

(function(window) {
  'use strict';

  var modules = {};

  window.require = function(module) {
    return modules[module];
  };

  window.define = function(name, what) {
    modules[name] = what;
  };

})(window);
