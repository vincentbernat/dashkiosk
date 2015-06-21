module.exports = (function(window, undefined) {
  'use strict';

  return {
    hide: function() {
      document.querySelector('.osd')
        .classList.remove('show');
    },
    show: function(text) {
      document.querySelector('.osd.technical').innerHTML = (
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
          '</p>'
      );
      document.querySelector('.osd.text').textContent = text;
      document.querySelector('.osd').classList.add('show');
    }
  };

})(window);
