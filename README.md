# babel-plugin-transform-es2015-modules-commonjs-simple

Use ES6 Module Format While Preserving Imported Symbol Names

The regular *babel-plugin-transform-es2015-modules-commonjs* module mangles symbol names in order to implement the ES6 modules feature of exporting bindings rather than references or values.

However, JavaScript source maps don't currently support mapping symbol names. So when debugging using source maps, any imports will not be available under their original name, which is can make for a frustrating experience. This module ensures that all symbol names are preserved. 

This module also adds an `addExport` option to allow modules with a single default export to be interoperable with CommonJS as they were in babel <6.

## Installation

```sh
$ npm install babel-plugin-transform-es2015-modules-commonjs-simple --save-dev
```

## Usage

If you are using a preset, it probably already includes `babel-plugin-transform-es2015-commonjs`. You can most likely get away with just adding this plugin to your config:

    {
        "presets": ["es2015"],
        "plugins": ["transform-es2015-modules-commonjs-simple"]
    }

This does not actually override the existing plugin - they both run. But, Babel runs the plugins from your local configuration before presets, so the module will already be transformed, meaning that there will be nothing to do when the module transform from the preset runs.

So this may not be perfectly efficient - but it should be safe. The only other alternative would be to create your own preset that excludes the CommonJS transformer.

## Options

The plugin option `addExports` will enable ES6 modules with a single default export to be used interoperably with CommonJS `require`. This matches the functionality of Babel <6, and basically adds this to the end of modules with a single default export:

    module.exports = exports['default'];

This allows you to use those modules as:

    var foo = require('foo')

instead of

    var foo = require('foo').default


## Building

#### To compile:

    npm install

#### To run tests:

    npm test

You can run individual tests using a special convetion, see `test/index.js`

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

Nothing at all. Using this module makes no demands on your source code, it just changes the compiled output. Just remove this module from your `.babelrc` (or substitute with the default commonjs plugin) and you're done.

## Relationship to Official Babel Transform

This code is almost entirely copied from the babel [source babel-plugin-transform-es2015-commonjs](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-es2015-modules-commonjs).

Because the transforms are all part of the complete babel code repository, this isn't actually a fork. This means it's a little tricky to keep it in sync with upstream changes.

It is current as of the commit 4142003bbd2fe3f862f9ddfde05274ee003de2cc on Feb 5. I will try to keep it updated as the original changes.

