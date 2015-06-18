(function(window, undefined) {
  'use strict';

  // Chromecast forces us to use an HTTPS URL but we cannot use an
  // HTTP URL after that. It would be better to switch only if needed,
  // but for now, let's just switch like this.
  if (window.location.protocol === 'https:') {
    window.location.href = window.location.href.replace(/^https:/, 'http:');
  }

  function Supervisor(options) {
    options = options || {};
    this.timeout = options.timeout || 30000;
    this.heartbeat = null;
    this.tries = 0;
  }

  Supervisor.prototype.setup = function() {
    console.error('[Dashkiosk/Device] Unimplemented method');
  };

  var iframe = window.document.getElementById('dashboard'),
      loading = window.document.getElementById('loading'),
      status = window.document.getElementById('status');

  // Load a new page
  Supervisor.prototype.load = function(url) {
    console.info('[Dashkiosk/Device] Asked to display URL', url);
    iframe.classList.remove('show');
    loading.classList.add('show');
    this.url = url;
    this.schedule();

    // To force iframe reload, we need to change the URL provided. We
    // add a query string to it.
    var a = document.createElement('a');
    a.href = url;
    this.tries += 1;
    iframe.src = a.origin + a.pathname + (a.search || '') +
      '?_v=' + this.tries +
      (a.hash || '') +
      '#timeout=' + this.timeout;

    if (this.onUrlLoad) {
      this.onUrlLoad(this.url);
    }

    var shortened = this.url;
    if (shortened.indexOf('#') >= 0) {
      shortened = shortened.slice(0, shortened.indexOf('#'));
    }
    status.textContent = 'Connecting to ' + shortened;
  };

  // Deadline for heartbeat hit
  Supervisor.prototype.deadline = function(url) {
    console.warn('[Dashkiosk/Device] Heartbeat missed, reload');
    this.load(url);
  };

  // Heartbeat received
  Supervisor.prototype.ack = function(event) {
    if (event.data === 'ready' && this.heartbeat) {
      // We don't really care of the origin
      console.debug('[Dashkiosk/Device] Heartbeat received');
      this.schedule();
      iframe.classList.add('show');
      loading.classList.remove('show');
    }
  };

  Supervisor.prototype.schedule = function() {
    var self = this;
    window.clearTimeout(this.heartbeat);
    this.heartbeat = window.setTimeout(function() { self.deadline(self.url); },
                                this.timeout);
  };

  window.onload = function() {
    var supervisor = new Supervisor();
    supervisor.setup();
  };

  window.dkSupervisor = Supervisor;

})(window);
