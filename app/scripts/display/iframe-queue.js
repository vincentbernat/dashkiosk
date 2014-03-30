define('iframe-queue', (function($, undefined) {
  'use strict';

  // Shortcut for all the names for transitionend
  var transitionEnd = 'transitionend webkitTransitionEnd oTransitionEnd otransitionend MSTransitionEnd';

  function Iframe(dashboard, options) {
    var self = this;
    this.dashboard = dashboard;
    this.ready = options.ready;
    this.el = $('<iframe>')
      .appendTo('body')
      .one('load', function() {
        self.show();
      })
      .attr('scrolling', 'no')
      .attr('frameborder', '0')
      .attr('src', dashboard.url);
  }

  Iframe.prototype.displayed = function() {
    return this.el.hasClass('show');
  };

  Iframe.prototype.remove = function() {
    var self = this;
    if (this.el.hasClass('show')) {
      this.el
        .removeClass('show')
        .one(transitionEnd, function() {
          self.el.remove();
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

  Queue.prototype.push = function(dashboard) {
    // Remove the first iframe if it is not loaded
    var self = this,
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
    iframe = new Iframe(dashboard, {
      ready: function() {
        // Sanity check: are we the first iframe?
        if (iframe !== self.queue[0]) {
          console.warn('[Dashkiosk] BUG: request to display a new iframe which is not in our queue',
                       iframe, self.queue);
          iframe.remove();
          return;
        }

        // Remove all other frames from the queue
        while (self.queue.length > 1) {
          var oldIframe = self.queue.pop();
          oldIframe.remove();
        }
        self.ready();
      }
    });

    // Put it in the queue
    this.queue.unshift(iframe);
  };

  return Queue;

})(Zepto));
