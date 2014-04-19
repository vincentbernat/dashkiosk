(function(window, undefined) {
  'use strict';

  var urn = 'urn:x-cast:com.deezer.cast.dashkiosk';

  function Supervisor(options) {
    options = options || {};
    this.timeout = options.timeout || 30000;
    this.heartbeat = null;
  }

  Supervisor.prototype.setup = function() {
    var cast = window.cast,
        self = this;

    // Enable this for dbugging
    // cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

    // Setup heartbeat mechanism
    window.addEventListener('message', function(event) {
      return self.ack(event);
    });

    // Setup receiver
    var inactivity = 30,
        appConfig = new cast.receiver.CastReceiverManager.Config();
    appConfig.maxInactivity = inactivity;
    this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

    // Setup message bus
    this.messageBus = this.castReceiverManager
      .getCastMessageBus(urn);
    this.messageBus.onMessage = function(event) {
      var message = JSON.parse(event.data),
          url = message.url;
      self.load(url);
    };

    // Start
    this.castReceiverManager.start(appConfig);
  };

  var iframe = window.document.getElementById('dashboard'),
      loading = window.document.getElementById('loading');

  // Load a new page
  Supervisor.prototype.load = function(url) {
    console.info('[Dashkiosk/Chromecast] Asked to display URL', url);
    iframe.classList.remove('show');
    loading.classList.add('show');
    this.url = url;
    this.schedule();
    iframe.src = url + '#timeout=' + this.timeout;
  };

  // Deadline for heartbeat hit
  Supervisor.prototype.deadline = function(url) {
    console.warn('[Dashkiosk/Chromecast] Heartbeat missed, reload');
    this.load(url);
  };

  // Heartbeat received
  Supervisor.prototype.ack = function(event) {
    if (event.data === 'ready' && this.heartbeat) {
      // We don't really care of the origin
      console.debug('[Dashkiosk/Chromecast] Heartbeat received');
      this.schedule();
      iframe.classList.add('show');
      loading.classList.remove('show');
    }
  };

  Supervisor.prototype.schedule = function() {
    var self = this;
    clearTimeout(this.heartbeat);
    this.heartbeat = setTimeout(function() { self.deadline(self.url); },
                                this.timeout);
  };

  window.onload = function() {
    var supervisor = new Supervisor();
    supervisor.setup();
  };

})(window);
