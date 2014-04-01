define('localstorage', (function(window, undefined) {
  'use strict';

  if ('localStorage' in window && window.localStorage !== null) {
    return window.localStorage;
  }

  console.warn('[Dashkiosk] local storage support is not available');
  return {
    setItem: function() {},
    getItem: function() { return null; }
  };

})(window));
