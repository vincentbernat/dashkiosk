'use strict';

var fs = require('fs'),
    path = require('path');

module.exports = function(io) {

  fs
    .readdirSync(__dirname)
    .filter(function(file) {
      return (file.indexOf('.') !== 0) && (file !== 'index.js');
    })
    .forEach(function(file) {
      var mod = require('./' + file);
      mod(io.of('/' + path.basename(file, '.js')));
    });

};
