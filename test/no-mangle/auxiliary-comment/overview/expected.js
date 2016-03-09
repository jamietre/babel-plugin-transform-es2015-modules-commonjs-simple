/*before*/"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.test = undefined;

/*after*/
/*before*/require("foo"); /*after*/
/*before*/require("foo-bar"); /*after*/
/*before*/require("./directory/foo-bar"); /*after*/
var /*before*/_foo = require("foo2") /*after*/;
/*before*/var /*after*/foo = babelHelpers.interopRequireDefault(_foo).default;
var /*before*/_foo2 = require("foo3") /*after*/;
/*before*/var /*after*/foo2 = babelHelpers.interopRequireWildcard(_foo2);
var /*before*/_foo3 = require("foo4") /*after*/;
/*before*/var /*after*/bar = _foo3.bar;
var /*before*/_foo4 = require("foo5") /*after*/;
/*before*/var /*after*/bar2 = _foo4.foo;
/*before*/exports. /*after*/test = test;
var test = /*before*/exports. /*after*/test = 5;

bar(foo, bar2);

/* my comment */
bar2;
foo;