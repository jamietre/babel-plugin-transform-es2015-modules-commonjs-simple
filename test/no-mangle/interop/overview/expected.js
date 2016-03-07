"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = undefined;

require("foo");

require("foo-bar");

require("./directory/foo-bar");

var _foo = require("foo2");

var foo = babelHelpers.interopRequireDefault(_foo).default;

var _foo2 = require("foo3");

var foo2 = babelHelpers.interopRequireWildcard(_foo2);

var _foo3 = require("foo4");

var bar = _foo3.bar;

var _foo4 = require("foo5");

var bar2 = _foo4.foo;
exports.test = test;
var test = exports.test = 5;

bar;
bar2;
foo;