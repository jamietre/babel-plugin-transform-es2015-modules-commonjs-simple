# babel-plugin-transform-es2015-modules-commonjs-simple

## About this fork

The default `babel-plugin-transform-es2015-modules-commonjs` mangles symbol names in order to imlement the fact that ES6 modules export *bindings* rather than references or values. This means if an export mutates within the module, consumers that reference the exported entity will refer to the actual value of the symbol in the module, which may change, not the reference or value that was originally exported.

#### How does Babel enable dynamic bindings?

In order to permit this interop with the ES2015 feature set, when compiling ES2105 modules to CommonJS format, Babel changes references to imported symbols so they always made to refer a child property, e.g.

    import foo from 'bar';
    console.log(foo.text)

is transformed to  

    var _foo = require('bar');
    var _foo2 = defaultExportInterop(_foo);

    console.log(_foo2["default"].text)


#### Why is this a problem?

This makes degugging difficult, since Javascript source maps are not currently capable of mapping symbol names. If you are writing good, modular code, you probably import a ton of symbols. If you are using source maps, you have probably been frustrated because none of your symbols are defined when debugging.

This plugin was created to give ES6 developers the option to sacrifice a feature that they may never use for the sake of preserving symbol names in the compiled code. This code with `babel-plugin-transform-es2015-modules-commonjs-simple` becomes:

    var _foo = require('bar');
    var foo = defaultExportInterop(_foo).default;

    console.log(foo.text)

#### What exactly am I sacrificing here?

This feature isn't especially well-known. Most articles that explain ES6 modules don't mention it at all. [Dr.Rauschmayer of course does](http://www.2ality.com/2015/07/es6-module-exports.html), since he knows all. That article does a good job of explaining why it could be useful.

However, this feature didn't exist with CommonJS modules. It's also unlikely that anything you consume from npm will use it today, since most everything on npm is expected to be a CommonJS module that runs in node, which doesn't know what an ES6 module is. So this is probably not happening anytime soon. If a module author today wants to export a binding, he's probably exporting and object and telling people to refer to properties of the object to support such functionality using CommonJS. 

So if you don't plan to mutate your exports or create circular references in your own code, you should be quite safe to use this.

#### Should I just use CommonJS instead?

Sure! Personally, though, I would much rather write my code with a forward-compatible module syntax, and not use a feature, then write non-forward-compatible CommonJS modules that also doesn't use a feature that doesn't exist.

#### ... and what happens to all my code when source maps start supporting symbols mapping?

Just remove this module from your babelrc (or substitute with the default commonjs plugin) and you're done.

#### Using it

If you are using a preset, it probably already includes `babel-plugin-transform-es2015-commonjs`. You can most likely get away with just adding this plugin to your config:

    {
        "presets": ["es2015"],
        "plugins": ["transform-es2015-modules-commonjs-simple"]
    }

This does not actually override the existing plugin - they both run. But, Babel runs the plugins from your local configuration before presets, so the module will already be transformed, meaning that there will be nothing to do when the module transform from the preset runs.

So this may not be perfectly efficient - but it should be safe. The only other alternative would be to create your own preset that excludes the CommonJS transformer.

#### Options

The plugin option `addExports` will enable ES6 modules with a single default export to be used interoperably with CommonJS `require`. This matches the functionality of Babel <6, and basically adds this to the end of modules with a single default export:

    module.exports = exports['default'];

This allows you to use those modules as:

    var foo = require('foo')

instead of

    var foo = require('foo').default

Typical configuration with `.babelrc` and also including the babel runtime:

    {
        "presets": ["es2015"],
        "plugins": [
            "transform-runtime",
            ["transform-es2015-modules-commonjs-simple", { addExports: true}]
        ]
    }

## Installation

Probably...

```sh
$ npm install https://github.com/jamietre/babel-plugin-transform-es2015-modules-commonjs-simple.git --save-dev
```

.. I will publish an npm module when it's been tested for a little longer!

## Credits

This code is almost entirely copied from the babel [source babel-plugin-transform-es2015-commonjs](https://github.com/babel/babel/tree/master/packages/babel-plugin-transform-es2015-modules-commonjs).
