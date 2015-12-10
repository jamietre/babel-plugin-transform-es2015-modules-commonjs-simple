/* Run tests expecting the following structure in a folkder "fixtures":

   testGroup/
     options.json
     testName/
       actual.js
       expected.js
       
   options.json are babel options for the tests in that group.
   
   You can invoke this with options
   
   --path  group/test
   
    Only run tests that match the pattern, use a * to match any group or test. If only one segment is passed, will run all tests in the group.

*/

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var babel = require('babel-core');
var _ = require('lodash');
var args = require('yargs').argv;

var groupName;
var testName;
var testPath = args.path;

if (testPath) {
  var parts = testPath.split('/');
  if (parts.length === 0 || parts.length > 2) {
    console.log("--path must include an argument that includes one or two parts, separated by a slash, e.g. '*/overview' or 'auxiliary-comment'");
    process.exit(1);
  }
  if (parts[0] !== '*') {
    groupName = parts[0];
  }
  if (parts.length > 1 && parts[1] !== '*') {
    testName = parts[1];
  }
}

var textEncoding =  { encoding: 'utf8' };

function testGroup(testRoot, testGroup) {
  var fixtureRoot = path.join(testRoot, testGroup);
  
  opts = getOpts(fixtureRoot)
  
  getDirectories(fixtureRoot)
  .filter(function(folder) {
     return !testName || folder === testName;
  })
  .map(function(folder) {
    test(fixtureRoot, folder, opts);
  });
  
}

function test(fixtureRoot, fixtureName, options) {
  it(fixtureName, function () {
    var testPath = path.resolve(fixtureRoot, fixtureName);
    var actualPath = path.join(testPath, 'actual.js');
    var expectedPath = path.join(testPath, 'expected.js');

    var libOpts = options.pluginOpts || {};
    var plugins = (options.plugins || []).concat([['../lib', libOpts]])
    delete options.pluginOpts;

    options.plugins = plugins;

    var testOpts = getOpts(testPath);
    try {
      var actual = babel.transformFileSync(actualPath, options).code;
    }
    catch(e) {
      if (testOpts.throws) {
        var regex = new RegExp(testOpts.throws);
        assert.ok(regex.test(e.message), "Should throw an error matching pattern /" + testOpts.throws + "/");
        return;
      } 
      throw e;
    }
    
    var expected = fs.readFileSync(expectedPath, textEncoding);

    assert.equal(actual, expected);
  });
}

function getDirectories(srcpath) {
  return fs.readdirSync(srcpath).filter(function(file) {
    return fs.statSync(path.join(srcpath, file)).isDirectory();
  });
}


function getOpts(srcpath) {
  var opts = {};
  try {
    opts = JSON.parse(fs.readFileSync(path.resolve(srcpath, "options.json"), textEncoding));
  }
  catch(e) { } 
  return opts;
  
}

var testRoot = path.join(__dirname, "fixtures");

getDirectories(testRoot)
.filter(function(folder) {
    return !groupName || folder === groupName;
})
.map(_.partial(testGroup, testRoot));

