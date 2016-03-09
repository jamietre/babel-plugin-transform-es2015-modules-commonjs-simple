# babel-plugin-transform-es2015-modules-commonjs-simple

Use ES6 Module Format While Preserving Imported Symbol Names

[![NPM version](http://img.shields.io/npm/v/babel-plugin-transform-es2015-modules-commonjs-simple.svg?style=flat-square)](https://www.npmjs.org/package/babel-plugin-transform-es2015-modules-commonjs-simple)
[![Travis build status](http://img.shields.io/travis/jamietre/babel-plugin-transform-es2015-modules-commonjs-simple/master.svg?style=flat-square)](https://travis-ci.org/jamietre/babel-plugin-transform-es2015-modules-commonjs-simple)

The regular *babel-plugin-transform-es2015-modules-commonjs* module mangles symbol names in order to implement the ES6 modules feature of exporting bindings rather than references or values.

However, JavaScript source maps don't currently support mapping symbol names. So when debugging using source maps, any imports will not be available under their original name, which is can make for a frustrating experience. This module ensures that all symbol names are preserved. 

This module adds a `noMangle` option that, when true, prevents variable names from being mangled.

This module also adds an `addExport` option to allow modules with a single default export to be interoperable with CommonJS as they were in babel <6.

## Installation

From [npm](https://www.npmjs.com/package/babel-plugin-transform-es2015-modules-commonjs-simple):

```sh
$ npm install --save-dev babel-plugin-transform-es2015-modules-commonjs-simple
```

## Usage

##### Without Presets 

If you are not using a babel preset, just include this module as a plugin instead of `transform-es2015-modules-commonjs` and add the option `noMangle: true`:

.babelrc

    {
        "plugins": [
            "transform-es2015-arrow-functions",
            "transform-es2015-tempalte-literals",
            ... 
            ["transform-es2015-modules-commonjs-simple", {
                "noMangle": true
            }]
        ],
        "sourceMaps": true
    }

##### With Babel Native Presets

If you are using a preset, it probably already includes `babel-plugin-transform-es2015-commonjs`. While you might be able to just add the `plugin` to your `.babelrc`, it doesn't appear to work reliably in all circumstances, so it's not recommended.  [See this discussion for details.](https://github.com/babel/babel-loader/issues/217). 

I wrote up some basic instructions on [creating your own preset using this module transformer](./creating-presets.md) based on the native `es2015` preset.

##### With ES2015 preset

If you're just using the generic ES2015 preset, then someone's been gracious enough to create a package for the ES2015 babel preset that has everything *except* `babel-plugin-transform-es2015-commonjs`, [here.](https://github.com/gajus/babel-preset-es2015-webpack)

So, with that installed:

.babelrc

    {
        "presets": [
            "es2015-webpack"
        ],
        "plugins": [
            ["transform-es2015-modules-commonjs-simple", {
                "noMangle": true
            }]
        ]
        "sourceMaps": true
    }


##### Any other clever way to override babel presets?

There's a package called [modify-babel-preset](https://github.com/developit/modify-babel-preset) which ought to let you override any preset with a lot less code. It's a good idea, and it would be nice to not have to keep your own preset "fork" in sync with the current default one. But it didn't seem to work for me; seems to need some updates for the latest version of babel.

## Options

##### noMangle

When true, will prevent variable names from being mangled. 

##### addExports

when true, will enable ES6 modules with a single default export to be used interoperably with CommonJS `require`. This matches the functionality of Babel <6, and basically adds this to the end of modules with a single default export:

    module.exports = exports['default'];

This allows you to use those modules as:

    var foo = require('foo')

instead of

    var foo = require('foo').default


## Building

#### To compile:

    npm install

#### To run tests:

All the tests from the native babel transform are under `fixtures`. Tests that validate the new features are under `nomangle` and `addexport`

    npm test

You can run individual tests using a special convention, see `test/index.js`

## Versioning

Starting with 6.6.5, the versions of this package will track the versions of the official `babel-plugin-transform-es2015-modules-commonjs` for simplicity. Since babel is monorepo, it's not possible to just fork the module itself, so I am tracking upstream changes in a fork [babel](https://github.com/jamietre/babel).

## Details of what's really going on here

There's a reason the native babel transform mangles variable names, and you might need this. The ES6 module format specifies that bindings, and not objects, are exported. This means if an exported entity mutates within the module, consumers that reference the exported entity will refer to the actual current value of the symbol, not the reference or value that was originally exported.

#### How does Babel enable dynamic bindings?

In order to implement the complete ES2015 feature set, when compiling ES2105 modules to CommonJS format, Babel changes references to imported symbols so they always made to refer a child property, e.g.

    import foo from 'bar';
    console.log(foo.text)

is transformed to  

    var _foo = require('bar');
    var _foo2 = defaultExportInterop(_foo);

    console.log(_foo2["default"].text)

Since the parent object never changes, any changes in values will always be current, as they are always resolved when evaluated.

#### Why is this a problem?

This is a problem because source maps don't currently support mapping of symbol names. This makes degugging difficult if the names aren't the same as the source code. If you are writing good, modular code, you probably import a ton of symbols. If you are using source maps, you have probably been frustrated because none of your symbols are defined when debugging.

This plugin was created to give ES6 developers the option to sacrifice a feature that they may never use for the sake of preserving symbol names in the compiled code. This code with `babel-plugin-transform-es2015-modules-commonjs-simple` becomes:

    var _foo = require('bar');
    var foo = defaultExportInterop(_foo).default;

    console.log(foo.text)

#### What exactly am I sacrificing here?

This feature isn't especially well-known. Most articles that explain ES6 modules don't mention it at all. [Dr.Rauschmayer of course does](http://www.2ality.com/2015/07/es6-module-exports.html), since he knows all. That article does a good job of explaining why it could be useful.

However, this feature didn't exist with CommonJS modules. It's also unlikely that anything you consume from npm will use it today, since most everything on npm is expected to be a CommonJS module that runs in node, which doesn't know what an ES6 module is. So this is probably not happening anytime soon. If a module author today wants to export a binding, he's probably exporting an object and telling people to refer to properties of the object.

So if you don't plan to mutate your exports or create circular references in your own code, you should be quite safe to use this.

#### Couldn't I just use "require" instead?

Sure! If you use `require` to import modules instead of `import`, then symbol names won't be mangled. 

Personally, though, I would much rather write my code with a forward-compatible module syntax, and not use a feature, then write non-forward-compatible CommonJS modules that also don't use a feature that doesn't exist with CommonJS modules anyway.

#### ... and what happens to all my code when source maps start supporting symbols mapping?

Nothing at all. Using this module makes no demands on your source code, it just changes the compiled output.  You can turn off the `noMangle` option to restore the native babel behavior, or swap in the offical plugin with no code changes required.

## Relationship to Official Babel Transform

When the `noMangle` option is false, this is code-identical to the native babel [source babel-plugin-transform-es2015-commonjs](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-es2015-modules-commonjs) transform. This plugin tracks changes to the official transform, but extends it with the options described here.


