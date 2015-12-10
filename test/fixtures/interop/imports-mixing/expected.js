"use strict";

var _foo = require("foo");

var foo = babelHelpers.interopRequireDefault(_foo).default;
var xyz = _foo.baz;

foo;
xyz;