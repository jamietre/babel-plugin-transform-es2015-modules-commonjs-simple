"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isOdd = undefined;
exports.nextOdd = nextOdd;

var _evens = require("./evens");

var isEven = _evens.isEven;
function nextOdd(n) {
  return isEven(n) ? n + 1 : n + 2;
}

var isOdd = exports.isOdd = (function (isEven) {
  return function (n) {
    return !isEven(n);
  };
})(isEven);