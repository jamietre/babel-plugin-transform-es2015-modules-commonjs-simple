'use strict';

var _mod = require('mod');

for (let _key in _mod) {
  if (_key === "default") continue;
  Object.defineProperty(exports, _key, {
    enumerable: true,
    get: function () {
      return _mod[_key];
    }
  });
}