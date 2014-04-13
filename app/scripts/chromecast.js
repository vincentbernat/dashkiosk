(function(window, undefined) {
  'use strict';

  function Supervisor() {
  }

  Supervisor.prototype.setup = function() {
    var cast = window.cast;
    cast.receiver.logger.setLevelValue(cast.receiver.LoggerLevel.DEBUG);

    // Setup receiver
    var inactivity = 6000,
        appConfig = new cast.receiver.CastReceiverManager.Config();
    appConfig.maxInactivity = inactivity;
    this.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

    // Setup message bus
    this.messageBus = this.castReceiverManager.getCastMessageBus('urn:x-cast:com.deezer.cast.dashkiosk');
    this.messageBus.onMessage = this.onMessage;

    // Start
    this.castReceiverManager.start(appConfig);
  };

  Supervisor.prototype.onMessage = function(event) {
    var message = event.message,
        url = message.url,
        iframe = window.document.getElementById('dashboard'),
        loading = window.document.getElementById('loading');

    iframe.addEventListener('load', function() {
      console.info('[Dashkiosk/Chromecast] Dashkiosk receiver loaded');
      iframe.classList.add('show');
      loading.classList.remove('show');
    });

    console.info('[Dashkiosk/Chromecast] Asked to display URL', url);
    iframe.classList.remove('show');
    loading.classList.add('show');
    iframe.src = url;
  };

  window.onload = function() {
    var supervisor = new Supervisor();
    supervisor.setup();
  };

})(window);
