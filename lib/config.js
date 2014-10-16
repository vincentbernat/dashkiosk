'use strict';

var nconf = require('nconf'),
    path = require('path'),
    net = require('net');

nconf
  .argv()
  .env('__')
  .defaults({
    configuration: './config.json',
    path: { root: path.normalize(path.join(__dirname, '..')) }
  })
  .file({ file: nconf.get('configuration') });

process.env.NODE_ENV = nconf.get('environment') || process.env.NODE_ENV || 'development';
nconf.set('environment', process.env.NODE_ENV);

nconf
  .add('moredefaults', // See: https://github.com/flatiron/nconf/issues/81
       { type: 'literal',
         store: {
           // Other paths
           path: {
             static: path.join(nconf.get('path:root'),
                               (nconf.get('environment') === 'development') ? 'build' : 'public')
           },
           // DB
           db: {
             database: 'dashkiosk-' + nconf.get('environment'),
             username: 'dashkiosk',
             password: 'dashkiosk',
             options: {
               dialect: 'sqlite',
               storage: path.join(nconf.get('path:root'), 'db',
                                  'dashkiosk-' + nconf.get('environment') + '.sqlite')
             }
           },
           // Logs
           log: {
             level: (nconf.get('environment') === 'development') ? 'debug' : 'info',
             file: null
           },
           // Chromecast
           chromecast: {
             enabled: false,
             receiver: null,
             app: '5E7A2C2C'
           },
           // Other stuff
           port: 9400,
           demo: false,
           secret: 'changeThisLameSecretPassphrase!!'
         }
       });

module.exports = nconf;
