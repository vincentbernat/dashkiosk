'use strict';

/* Very simplistic but specific template engine. Only able to do
 * substitutions in HTML files. Expect them to be double quoted. Need
 * spaces after the closing double quote to avoid modifying document
 * length. Handles file revving. */

var _ = require('lodash'),
    glob = require('glob'),
    path = require('path');

module.exports = function(base, substitutions) {

  var onlyFor = _.map(glob.sync(path.resolve(base, '*.html')),
                      function(p) { return path.relative(base, p); });
  onlyFor = onlyFor.concat(_.map(onlyFor, function(p) { return p.slice(0, p.length - 5); }));
  var cache = {};

  return function(req, res, next) {
    // Handle only GET/HEAD files
    if ((req.method !== 'GET' && req.method !== 'HEAD') ||
        (onlyFor || []).indexOf(req.path.slice(1)) === -1) {
      return next();
    }
    var write = res.write;
    res.write = function(chunk, encoding) {
      var html = chunk.toString(encoding);
      _.each(substitutions, function(value, key) {
        var regex = new RegExp('"([^"]*)\\.\\.' + key.toUpperCase() + '\\.\\.([^"]*)"(\\s*)', "g");
        html = html.replace(regex, function(match, p1, p2, spaces) {
          if (match in cache) {
            // Do some memoization because we use glob.sync
            return cache[match];
          }
          var file = [p1, value, p2].join('');
          /* Is that really a file? We just check if we have a '/' */
          if (file.indexOf('/') !== -1) {
            /* We may want to match the appropriate file on the FS. We should be async, but... */
            var ext = path.extname(file),
                matches = glob.sync(path.resolve(base,
                                                 path.dirname(file),
                                                 '*' + path.basename(file, ext) + '*' + ext));
            if (matches.length > 0) {
              file = path.relative(base, matches[0]);
            }
          }
          return (cache[match] = ['"', file, '"',
                                  new Array(spaces.length - file.length +
                                            p1.length + p2.length + key.length + 4 + 1).join(' ')].join(''));
        });
      });
      return write.call(res, new Buffer(html, encoding), encoding);
    };
    return next();
  };

};
