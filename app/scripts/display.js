/**
 * Subscribe to websocket and display requested URL.
 */

(function(window, io, $, undefined) {
  'use strict';

  /* Display related functions */
  var display = (function() {

    /* Handle iframes */
    var iframes = (function() {
      var transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd',
          iframes = [];         // Queue of frames

      /* Remove all iframes */
      function flush() {
        var iframe;
        while ((iframe = iframes.shift())) {
          remove(iframe);
        }
      }

      /* Remove a given iframe */
      function remove(iframe) {
        if (iframe.hasClass('show')) {
          iframe
            .removeClass('show')
            .one(transitionEnd, function() {
              iframe.remove();
            });
        } else {
          iframe.remove();
        }
      }

      /* Create a new iframe with the given source */
      function push(url) {
        // Remove the first iframe if it is not loaded
        var iframe = iframes.shift();
        if (iframe !== undefined) {
          if (iframe.hasClass('show')) {
            // Oops, it is loaded, put it back.
            iframes.unshift(iframe);
          } else {
            // Remove it, we will put ours instead
            remove(iframe);
          }
        }

        // Build a new frame
        iframe = $('<iframe>')
          .appendTo('body')
          .one('load', function() {
            show(iframe);
          })
          .attr('scrolling', 'no')
          .attr('frameborder', '0')
          .attr('src', url.target);

        // Put it in the queue
        iframes.unshift(iframe);
      }

      /* Display an iframe */
      function show(iframe) {
        if (iframe !== iframes[0]) {
          console.warn('[Dashkiosk] BUG: request to display a new iframe which is not in our queue',
                       iframe, iframes);
          remove(iframe);
          return;
        }
        console.info('[Dashkiosk] iframe ready ' + iframe.attr('src'));
        $('#loading').removeClass('show');
        iframe.addClass('show');
        while (iframes.length > 1) {
          var oldIframe = iframes.pop();
          remove(oldIframe);
        }
      }

      return {
        flush: flush,
        push: push
      };

    })();

    /* Display loading screen */
    function loading() {
      iframes.flush();
      $('#loading').addClass('show');
    }

    /* Display the given URL */
    function url(u) {
      // Check URL validity
      if (typeof u.target !== 'string') {
        console.warn('[Dashkiosk] received an URL without target: ', u);
        return;
      }
      // Push it
      iframes.push({
        target: u.target
      });
    }

    return {
      loading: loading,
      url: url
    };

  })();

  /* Socket.io related functions */
  var socketio = (function() {

    function connect() {
      var socket = io.connect(window.location.origin + '/display');

      socket.on('connect', function() {
        console.info('[Dashkiosk] connected to socket.io server');
      });

      socket.on('disconnect', function() {
        console.warn('[Dashkiosk] connection to socket.io lost');
        display.loading();
      });

      socket.on('url', function(url) {
        console.info('[Dashkiosk] should display URL ', url);
        display.url(url);
      });

      socket.on('reload', function() {
        console.info('[Dashkiosk] reload requested');
        window.location.reload();
      });
    }

    return {
      connect: connect
    };

  })();

  $(window).on('load', function() {
    // Tell through a message
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage('ready', '*');
    }
    // Tell through a JSInterface
    if (window.JSInterface && window.JSInterface.ready) {
      window.JSInterface.ready();
    }
    // OK, ready, connect to socket.io
    console.log('[Dashkiosk] dashkiosk ready, connect to socket.io server');
    socketio.connect();
  });

})(window, io, Zepto);
