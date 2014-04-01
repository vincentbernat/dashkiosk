define('osd', (function($, undefined) {
  'use strict';

  return {
    hide: function() { $('.osd').removeClass('show'); },
    show: function(text) {
      $('.osd')
        .text(text)
        .addClass('show');
    }
  };

})(Zepto));
