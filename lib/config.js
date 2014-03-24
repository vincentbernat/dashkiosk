'use strict';

var path = require('path'),
    rootPath = path.normalize(path.join(__dirname, '..')),
    env = process.env.npm_package_config_env  || process.env.NODE_ENV || 'development';

/**
 * Location of static files
 */
function staticPath(root) {
  switch (env) {
  case 'development':
    return path.join(root, 'build');
  default:
    return path.join(root, 'public');
  }
}

module.exports = {
  root: rootPath,
  static: staticPath(rootPath),
  port: process.env.npm_package_config_port || process.env.PORT || 9400,
  env:  env,
  logLevel: (env === 'development') ? 'debug' : 'info'
};
