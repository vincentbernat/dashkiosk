define('localstorage', (function(window, undefined) {
  'use strict';

  if ('localStorage' in window && window.localStorage !== null) {
    return {
      getItem: function(key) { return window.localStorage.getItem(key); },
      setItem: function(key, value) { window.localStorage.setItem(key, value); }
    };
  }

  console.warn('[Dashkiosk] local storage support is not available, fallback to cookies');
  function Storage(name) {
    this.name = name;
  }
  Storage.prototype.write = function(value) {
    var days = 365,
        date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));

    var expires = '; expires='+date.toGMTString();
    window.document.cookie = this.name + '=' + value + expires + '; path=/';
  };

  Storage.prototype.read = function() {
    var nameEQ = this.name + '=',
        ca = document.cookie.split(';'),
        i, c;

    for (i=0; i < ca.length; i++) {
      c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }

      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  };

  Storage.prototype.getItem = function(key) {
    var data = JSON.parse(this.read() || '{}');
    return data[key];
  };

  Storage.prototype.setItem = function(key, value) {
    var data = JSON.parse(this.read() || '{}');
    data[key] = value;
    this.write(JSON.stringify(data));
  };

  return new Storage('dashkiosk');

})(window));
