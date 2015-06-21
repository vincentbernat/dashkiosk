(function(Supervisor, cast, window, undefined) {
  'use strict';

  Supervisor.prototype.setup = function() {
    var urn = 'urn:x-cast:com.deezer.cast.dashkiosk',
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
    appConfig.statusText = 'Waiting for an URL';
    var castReceiverManager = cast.receiver.CastReceiverManager.getInstance();

    // Setup message bus
    var messageBus = castReceiverManager
      .getCastMessageBus(urn);
    messageBus.onMessage = function(event) {
      var message = JSON.parse(event.data),
          url = message.url;
      self.load(url);
    };

    // Setup callback when a URL is loaded
    this.onUrlLoad = function(url) {
      castReceiverManager.setApplicationState('Receiver: ' + url);
    };

    // Start
    castReceiverManager.start(appConfig);
  };

})(require('./device-receiver.js')(window), window.cast, window);
