define('iframe-queue', (function($, undefined) {
  'use strict';

  // Shortcut for all the names for transitionend
  var transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd';

  function Iframe(url, options) {
    var _this = this;
    this.url = url;
    this.ready = options.ready;
    this.el = $('<iframe>')
      .appendTo('body')
      .one('load', function() {
        _this.show();
      })
      .attr('scrolling', 'no')
      .attr('frameborder', '0')
      .attr('src', url.target);
  }

  Iframe.prototype.displayed = function() {
    return this.el.hasClass('show');
  };

  Iframe.prototype.remove = function() {
    var _this = this;
    if (this.el.hasClass('show')) {
      this.el
        .removeClass('show')
        .one(transitionEnd, function() {
          _this.el.remove();
        });
    } else {
      this.el.remove();
    }
  };

  Iframe.prototype.show = function() {
    console.info('[Dashkiosk] iframe ready ' + this.el.attr('src'));
    if (this.ready) {
      this.ready();
    }
    this.el.addClass('show');
  };

  function Queue(options) {
    this.queue = [];
    this.ready = options.ready;
  }

  Queue.prototype.flush = function() {
    var iframe;
    while ((iframe = this.queue.shift())) {
      iframe.remove();
    }
  };

  Queue.prototype.push = function(url) {
    // Remove the first iframe if it is not loaded
    var _this = this,
        iframe = this.queue.shift();
    if (iframe !== undefined) {
      if (iframe.displayed()) {
        // Oops, it is loaded, put it back.
        this.queue.unshift(iframe);
      } else {
        // Remove it, we will put ours instead
        iframe.remove();
      }
    }

    // Build a new frame
    iframe = new Iframe(url, {
      ready: function() {
        // Sanity check: are we the first iframe?
        if (iframe !== _this.queue[0]) {
          console.warn('[Dashkiosk] BUG: request to display a new iframe which is not in our queue',
                       iframe, _this.queue);
          iframe.remove();
          return;
        }

        // Remove all other frames from the queue
        while (_this.queue.length > 1) {
          var oldIframe = _this.queue.pop();
          oldIframe.remove();
        }
        _this.ready();
      }
    });

    // Put it in the queue
    this.queue.unshift(iframe);
  };

  return Queue;

})(Zepto));
