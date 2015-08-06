/**
 * Dashboards for unassigned displays. Just rotate a bunch of
 * background images.
 */

(function(window, undefined) {
  'use strict';

  var duration = 60,
      document = window.document;

  // Preload the next image and insert it in place of the current one.
  function rotate() {

    // Don't do anything if the visibility is not right
    document.removeEventListener('visibilitychange', rotate, false);
    if (document.hidden === true) {
      document.addEventListener('visibilitychange', rotate, false);
      return;
    }
    document.removeEventListener('visibilitychange', rotate, false);

    /* Create an img tag to preload the photo */
    var photo = document.querySelector('.photo').dataset.image,
        preload = document.createElement('img');

    var cleanup = function() {
          /* We only need two photos in background (for transition purpose) */
          var bg = document.querySelector('.background');
          while (bg.childNodes.length > 1) {
            bg.removeChild(bg.lastChild);
          }
        },
        load = function() {
          preload.removeEventListener('load', load, false);
          preload.removeEventListener('error', error, false);

          /* Add a div with the photo as first child.
             This will trigger the CSS transition */
          var bg = document.querySelector('.background');
          var newbg = document.createElement('div');
          newbg.style.backgroundImage = 'url(' + photo + ')';
          bg.insertBefore(newbg, bg.firstChild);
        },
        error = function() {
          preload.removeEventListener('load', load, false);
          preload.removeEventListener('error', error, false);
        };

    /* Do the preload. Once loaded, load the image into the background */
    console.log('[Dashkiosk/unassigned] Load ' + photo);
    cleanup();
    preload.addEventListener('load', load, false);
    preload.addEventListener('error', error, false);
    preload.setAttribute('src', photo);

    /* Rotate the photos */
    var last = document.querySelector('.photo:last-child'),
        first = document.querySelector('.photo:first-child');
    first.parentNode.insertBefore(last, first);
    window.setTimeout(rotate, duration * 1000);
  }

  function clock() {
    var interval = 60 * 1000,
        now = new Date(),
        delay = interval - now % interval,
        hours = now.getHours(),
        minutes = now.getMinutes();

    document.querySelector('.clock').textContent = hours + ((minutes >= 10)?':':':0') + minutes;

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

  window.addEventListener('DOMContentLoaded', function() {
    /* Shuffle the photos */
    var photos = shuffle(Array.prototype.slice.call(document.querySelectorAll('.photo')));
    while (photos.length) {
      var photo = photos.pop();
      photo.parentNode.appendChild(photo);
    }

    rotate(); // Rotate photos
    clock(); // Display clock
  });

})(window);
