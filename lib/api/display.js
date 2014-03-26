'use strict';

// API module for displays. This is a websocket only API.

var winston = require('winston'),
    scs = require('../scs'),
    utils = require('../utils');

module.exports = function displayApi(io) {

io.on('connection', function(socket) {
  winston.info('new client', socket.handshake.address);
  socket.on('register', function(data) {

    // Handle registration, retrieve the client name or generate a new one.
    var client = null;
    try {
      client = JSON.parse(scs.decode(data.blob));
    } catch (e) {
      client = null;
    }
    client = {
      name: (client === null ||
             typeof client.name !== 'string' ||
             client.name.length === 0) ?
        utils.randomString(6) :
        client.name
    };
    socket.emit('register', scs.encode(JSON.stringify(client)));

    winston.info('registered client', client);
    socket.join('displays');
  });
});

// Use a fixed list of URL for now
setInterval((function() {
  var urls = [ '/unassigned',
               'http://socket.io/',
               'http://fr.wikipedia.org/' ];
  return function() {
    winston.info('sending new URL to everyone', { url: urls[0] });
    io.in('displays').emit('url', { target: urls[0] });
    urls.push(urls.shift());
  };
})(), 10000);

};
