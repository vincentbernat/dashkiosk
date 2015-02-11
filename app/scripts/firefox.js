(function(window, undefined) {
  'use strict';

  var Apps = window.navigator.mozApps,
      firefox = (Apps && Apps.install);

  if (firefox) {
    document.body.className += 'is-firefox';
  } else {
    document.body.className += 'is-not-firefox';
  }

  window.document.addEventListener('DOMContentLoaded', function() {
    var button = document.getElementById('install');
    button.addEventListener('click', function() {
      console.debug('[Dashkiosk] Trigger installation of Firefox OS receiver');
      var request = Apps.install(window.location.origin + '/manifest.webapp');
      request.onsuccess = function() {
        console.debug('[Dashkiosk] Firefox OS receiver successfully installed');
      };
      request.onerror = function() {
        console.debug('[Dashkiosk] Installation of Firefox OS was unsuccessful',
                      this.error);
      };
    });
  });

})(window);
