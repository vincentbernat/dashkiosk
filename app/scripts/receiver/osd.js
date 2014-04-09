define('osd', (function(window, $, undefined) {
  'use strict';

  return {
    hide: function() {
      $('.osd')
        .removeClass('show');
    },
    show: function(text) {
      $('.osd.technical')
        .html(
          '<p>clientWidth/Height: ' +
            (window.document.documentElement.clientWidth || '???') + '×' +
            (window.document.documentElement.clientHeight || '???') +
            '</p><p>' +
            '<p>innerWidth/Height: ' +
            (window.innerWidth || '???') + '×' +
            (window.innerHeight || '???') +
            '</p><p>' +
            '<p>screenWidth/Height: ' +
            (window.screen.width || '???') + '×' +
            (window.screen.height || '???') +
            '</p>');
      $('.osd.text')
        .text(text);
      $('.osd')
        .addClass('show');
    }
  };

})(window, Zepto));
