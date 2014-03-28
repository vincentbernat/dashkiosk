'use strict';

/* Encode/decode data using the SCS scheme:
 *   http://www.rfc-base.org/txt/rfc-6896.txt
 */

var crypto = require('crypto'),
    config = require('../config'),
    cipher = 'aes-256-cbc',
    keyLength = 256/8,
    ivLength = 128/8,
    hmac = 'sha512',
    hashLength = 512/8,
    key = config.get('secret'),
    // We need unrelated encryption and authentication keys, let's
    // split our key in two parts.
    ekey = crypto.pbkdf2Sync(key.slice(0, Math.floor(key.length / 2)),
                             'salt', 2000, keyLength),
    hkey = crypto.pbkdf2Sync(key.slice(Math.floor(key.length / 2)),
                             'salt', 2000, hashLength);

module.exports.encode = function(clear) {
  var iv = crypto.randomBytes(ivLength),
      atime = Math.floor((new Date()).getTime() / 1000) + '',
      tid = crypto.pseudoRandomBytes(10).toString('base64'),
      _cipher = crypto.createCipheriv(cipher, ekey, iv),
      // padding is done directly by the crypto library, skip that
      data = Buffer.concat([_cipher.update(clear, 'utf-8'),
                            _cipher.final()]),
      value = data.toString('base64') + '|' +
        atime.toString('base64') + '|' +
        tid.toString('base64') + '|' +
        iv.toString('base64'),
      authTag = crypto.createHmac(hmac, hkey).update(value).digest();
  return value + '|' + authTag.toString('base64');
};

module.exports.decode = function(value) {
  var components = value.split('|');
  if (components.length !== 5) {
    return null;
  }

  // We ignore the TID

  var rtag = components[4],
      ctag = crypto.createHmac(hmac, hkey)
        .update(components[0] + '|' +
                components[1] + '|' +
                components[2] + '|' +
                components[3])
        .digest('base64');
  if (ctag !== rtag) {
    return null;
  }

  // We ignore the timestamp

  var clear = null;
  try {
    var iv = new Buffer(components[3], 'base64'),
        data = new Buffer(components[0], 'base64'),
        _cipher = crypto.createDecipheriv(cipher, ekey, iv);
    clear = Buffer.concat([_cipher.update(data),
                           _cipher.final()])
      .toString('utf8');
  } catch (e) {
  }

  return clear;
};
