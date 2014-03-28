'use strict';

var nconf = require('nconf'),
    path = require('path');

nconf
  .argv()
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
             database: '',
             username: '',
             password: '',
             options: {
               dialect: 'sqlite',
               storage: path.join(nconf.get('path:root'), 'dashkiosk.sqlite')
             }
           },
           // Others
           port: 9400,
           'log-level': (nconf.get('environment') === 'development') ? 'debug' : 'info',
           secret: 'changeThisLameSecretPassphrase!!'
         }
       });

module.exports = nconf;
