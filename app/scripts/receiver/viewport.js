define('viewport', (function(window, $) {
  'use strict';
  /* Socket.io related functions */

  function update(viewport) {
    if (!viewport) {
      $('meta[name="viewport"]').attr('content',
                                      'width=device-width,user-scalable=no');
      return;
    }
    var dimensions = viewport.split('x'),
        width = dimensions[0] || null,
        height = dimensions[1] || null,
        vp = [ width?('width=' + dimensions[0]):'',
               height?('height=' + dimensions[1]):'',
               'user-scalable=no' ];
    $('meta[name="viewport"]').attr('content',
                                    vp.join(','));
  }

  return {
    update: update
  };

})(window, Zepto));
