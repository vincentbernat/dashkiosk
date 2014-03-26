'use strict';

module.exports.randomString = function(length) {
  var bits = 36,
      tmp,
      out = "";
  while (out.length < length) {
    tmp = Math.random().toString(bits).slice(2);
    out += tmp.slice(0, Math.min(tmp.length, (length - out.length)));
  }
  return out.toUpperCase();
};
