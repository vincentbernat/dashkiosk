module.exports = (function(window) {
  'use strict';

  window.addEventListener('resize', function() {
    // On resize, find any element with a simulatedViewport attribute
    // and update it. We ensure we start with the root one.
    var de = window.document.documentElement;
    var vps = de.querySelectorAll('[data-simulated-viewport]');
    var root = new Viewport(de.dataset.simulatedViewport);

    root.update();
    for (var i = 0; i < vps.length; ++i) {
      var vp = new Viewport(vps[i].dataset.simulatedViewport, vps[i]);
      vp.update();
    }
  });

  // Create a new viewport for the provide `el' element.
  function Viewport(spec, el) {
    this.el = el || window.document.documentElement;
    this.width = this.height = null;
    if (spec) {
      var dimensions = spec.split('x');
      this.width = dimensions[0] || null;
      this.height = dimensions[1] || null;
      this.el.dataset.simulatedViewport = spec;
    } else {
      if (this.el.dataset.simulatedViewport !== undefined) {
        delete this.el.dataset.simulatedViewport;
      }
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
      console.debug('[Dashkiosk] no need to rescale ' + tag);
      reset();
      return;
    }
    transform = 'scaleX(' + scale + ') scaleY(' + scale +')';
    console.debug('[Dashkiosk] apply following transform for ' + tag + ': ' + transform);
    style.transformOrigin =  style.mozTransformOrigin = style.webkitTransformOrigin = 'top left';
    style.transform = style.mozTransform = style.webkitTransform = transform;
    style.width = Math.round(cw / scale) + 'px';
    style.height = Math.round(ch / scale) + 'px';
  };

  return Viewport;

})(window);
