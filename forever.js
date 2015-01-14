'use strict';

var respawn = require('respawn'),
    path = require('path'),
    node = process.argv[0],
    server = process.argv[2];

var monitor = respawn(
  [node, server].concat(process.argv.splice(3)), {
    stdio: 'inherit',
    maxRestarts: -1,              // Run forever
    sleep: 1000                   // Wait 1s between restarts
  });

monitor.start();
