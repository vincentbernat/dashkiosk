module.exports = (function(window) {
  'use strict';

  // Create a new viewport for the provide `el' element.
  function Viewport(spec, el) {
    this.el = el || window.document.documentElement;
    this.width = this.height = null;
    if (spec) {
      var dimensions = spec.split('x');
      this.width = dimensions[0] || null;
      this.height = dimensions[1] || null;
    }
  }

  Viewport.prototype.update = function() {
    // Support of viewport is highly dependant of the client. Browsers
    // do that, but other clients don't.
    var de = window.document.documentElement,
        el = this.el,
        style = el.style,
        reset = function() {
          style.transform = style.mozTransform = style.webkitTransform = '';
          style.width = '';
          style.height = '';
        };
    if (!this.width && !this.height) {
      reset();
      return;
    }
    var cw = (el !== de && parseInt(de.style.width)) || de.clientWidth,
        ch = (el !== de && parseInt(de.style.height)) || de.clientHeight,
        tw = this.width || this.height * cw / ch,
        th = this.height || this.width * ch / cw,
        scale = Math.min(cw / tw, ch / th),
        transform = '',
        tag = el.tagName;
    if (scale - 1 < 0.02 && scale - 1 > -0.02) {
      console.debug('[Dashkiosk] No need to rescale ' + tag);
      reset();
      return;
    }
    transform = 'scaleX(' + scale + ') scaleY(' + scale +')';
    console.debug('[Dashkiosk] Apply following transform for ' + tag + ': ' + transform);
    style.transformOrigin =  style.mozTransformOrigin = style.webkitTransformOrigin = 'top left';
    style.transform = style.mozTransform = style.webkitTransform = transform;
    style.width = Math.round(cw / scale) + 'px';
    style.height = Math.round(ch / scale) + 'px';
  };

  return Viewport;

})(window);
