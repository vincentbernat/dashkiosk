define('localstorage', (function(window, undefined) {
  'use strict';

  // Using local storage if available
  function LocalStorage() {
  }
  if ('localStorage' in window && window.localStorage !== null) {
    LocalStorage.prototype.getItem = function(key) {
      return window.localStorage.getItem(key);
    };
    LocalStorage.prototype.setItem = function(key, value) {
      window.localStorage.setItem(key, value);
    };
  } else {
    LocalStorage.prototype.getItem = function() { return undefined; };
    LocalStorage.prototype.setItem = function() { };
  }

  // Cookie storage
  function CookieStorage(name) {
    this.name = name;
  }

  CookieStorage.prototype._write = function(value) {
    var days = 365,
        date = new Date();
    date.setTime(date.getTime() + (days*24*60*60*1000));

    var expires = '; expires='+date.toGMTString();
    window.document.cookie = this.name + '=' + value + expires + '; path=/';
  };

  CookieStorage.prototype._read = function() {
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

  CookieStorage.prototype.getItem = function(key) {
    var data = JSON.parse(this._read() || '{}');
    return data[key];
  };

  CookieStorage.prototype.setItem = function(key, value) {
    var data = JSON.parse(this._read() || '{}');
    data[key] = value;
    this._write(JSON.stringify(data));
  };

  var cookies = new CookieStorage('dashkiosk'),
      local = new LocalStorage();

  return {
    getItem: function(key) {
      return local.getItem(key) || cookies.getItem(key);
    },
    setItem: function(key, value) {
      local.setItem(key, value);
      cookies.setItem(key, value);
    }
  };


})(window));
