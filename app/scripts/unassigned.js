/**
 * Dashboards for unassigned displays. Just rotate a bunch of
 * background images.
 */

(function(window, $, undefined) {
  'use strict';

  var transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',
      duration = 60;

  // Preload the next image and insert it in place of the current one.
  function rotate() {

    if ('hidden' in window.document &&
        window.document.hidden &&
        $('.background').children().length) {
      // In the background, don't need to load anything
      window.setTimeout(rotate, duration * 1000);
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
    window.setTimeout(rotate, duration * 1000);
  }

  function clock() {
    var interval = 60 * 1000,
        now = new Date(),
        delay = interval - now % interval,
        hours = now.getHours(),
        minutes = now.getMinutes();

    $('.clock').text(hours + ((minutes >= 10)?':':':0') + minutes);

    // reschedule
    window.setTimeout(clock, delay);
  }

  function shuffle(array) {
    var currentIndex = array.length,
        temporaryValue,
        randomIndex;

    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  $(window).on('load', function() {
    $('.background').after(shuffle($('.photo')));
    rotate(); // Rotate photos
    clock(); // Display clock
  });

})(window, Zepto);
