module.exports = (function(window) {
  'use strict';
  /* Socket.io related functions */

  function Viewport(spec) {
    if (!spec) {
      this.width = this.height = null;
      return;
    }
    var dimensions = spec.split('x');
    this.width = dimensions[0] || null;
    this.height = dimensions[1] || null;
  }

  Viewport.prototype.update = function() {
    // Support of viewport is highly dependant of the client. Browsers
    // do that, but other clients don't.
    var de = window.document.documentElement;
    if (!this.width && !this.height) {
      de.style.transform = '';
      de.style.width = '';
      de.style.height = '';
    } else {
      var cw = de.clientWidth,
          ch = de.clientHeight,
          tw = this.width || this.height * cw / ch,
          th = this.height || this.width * ch / cw,
          scale = Math.min(cw / tw, ch / th),
          transform = '';
      if (scale - 1 > 0.02 || scale - 1 < -0.02) {
        transform = 'scaleX(' + scale + ') scaleY(' + scale +')';
      }
      console.debug('[Dashkiosk] Apply following transform: ' + transform);
      de.style.transformOrigin = 'top left';
      de.style.transform = transform;
      de.style.width = cw / scale + 'px';
      de.style.height = ch / scale + 'px';
    }
  };

  Viewport.prototype.adapt = function(el) {
    if (!this.width && !this.height) {
      return;                   // Nothing to do
    }
    var de = window.document.documentElement,
        cw = parseInt(de.style.width) || de.clientWidth,
        ch = parseInt(de.style.height) || de.clientHeight,
        tw = this.width || this.height * cw / ch,
        th = this.height || this.width * ch / cw,
        scale = Math.min(cw / tw, ch / th);
    if (scale - 1 < 0.02 && scale - 1 > -0.02) {
      // Well, better not do anything
      console.info('[Dashkiosk] No need to rescale, viewport is already OK');
      return;
    }
    console.info('[Dashkiosk] Will apply a scale factor of ' + scale);

    tw = Math.round(tw);
    th = Math.round(th);
    scale = 'scale(' + scale + ')';
    el.style.width = tw + 'px';
    el.style.height = th + 'px';
    el.style.mozTransform = scale;
    el.style.webkitTransform = scale;
    el.style.transform = scale;
  };

  return Viewport;

})(window);
