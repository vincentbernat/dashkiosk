/**
 * Dashboards for unassigned displays. Just rotate a bunch of
 * background images.
 */

(function(window, $, undefined) {
  'use strict';

  var transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',
      duration = 10;

  // Preload the next image and insert it in place of the current one.
  function rotate() {

    if (window.document.hasFocus &&
        !window.document.hasFocus() &&
        $('.background').children().length) {
      // In the background, don't need to load anything
      return;
    }

    var photo = $('.photo')
          .first()
          .data('image'),
        preload = $('<img>'),
        cleanup = function() {
          $('.background')
            .children()
            .slice(1)
            .remove();
        };

    console.log('[Dashkiosk/unassigned] Load ' + photo);
    cleanup();
    preload
      .one('load', function() {
        preload.off('error');
        $('<div>')
          .css({'background-image': 'url(' + photo + ')'})
          .appendTo($('.background'))
          .prependTo($('.background'))
          .one(transitionEnd, cleanup);
      })
      .one('error', function() {
        preload.off('load');
      })
      .attr('src', photo);

    $('.photo').last().after($('.photo').first());
  }

  $(window).on('load', function() {
    rotate();
    window.setInterval(rotate, duration * 1000);
  });

})(window, Zepto);
