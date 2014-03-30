'use strict';

var fs = require('fs'),
    path = require('path');

module.exports = function(bus, io) {

  fs
    .readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function(file) {
      var mod = require('./' + file);
      mod(bus, io.of('/' + path.basename(file, '.js')));
    });

};
