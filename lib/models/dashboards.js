'use strict';

var _ = require('lodash');

function Dashboard(url, options) {
  this.url = url;
  var defaults = {
    timeout: null
  };
  this.options = _.pick(_.defaults(options || {},
                                   defaults), _.keys(defaults));
}

// Not persisted directly

module.exports = Dashboard;
