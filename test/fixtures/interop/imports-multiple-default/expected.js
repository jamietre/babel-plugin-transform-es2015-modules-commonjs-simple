"use strict";

var _foo = require("foo");

var foo4 = babelHelpers.interopRequireWildcard(_foo);
var foo = babelHelpers.interopRequireDefault(_foo).default;
var foo2 = babelHelpers.interopRequireDefault(_foo).default;
var foo3 = _foo.foo3;

foo;
foo2;
foo3;
foo4.foo2;