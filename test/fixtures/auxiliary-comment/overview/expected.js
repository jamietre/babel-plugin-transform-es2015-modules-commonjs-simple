/*before*/"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = undefined;

require("foo");

require("foo-bar");

require("./directory/foo-bar");

var _foo = require("foo2");

var /*after*/foo = babelHelpers.interopRequireDefault(_foo).default;
/*before*/
var _foo2 = require("foo3");

var /*after*/foo2 = babelHelpers.interopRequireWildcard(_foo2);
/*before*/
var _foo3 = require("foo4");

var /*after*/bar = _foo3.bar;
/*before*/
var _foo4 = require("foo5");

var /*after*/bar2 = _foo4.foo;
/*before*/exports. /*after*/test = test;
var test = /*before*/exports. /*after*/test = 5;

bar(foo);

/* my comment */
bar2;
foo;