var path = require("path")

var loc = __dirname;
var name = path.basename(path.dirname(loc));

require("babel-helper-transform-fixture-test-runner")(
    loc + "/fixtures",
    name, 
    {},
    {
        plugins: ["external-helpers", "transform-es2015-modules-commonjs-simple"]
    });
