# babel-plugin-transform-es2015-modules-commonjs-simple

## About this fork

The default `babel-plugin-transform-es2015-modules-commonjs` mangles symbol names in order to imlement the automatic update feature of ES2015 modules. This means if an export mutates within the module, consumers that reference the exported entity will refer to the actual exported reference from the module, not the property that was originally exported.

In order to permit this interop with the ES2015 feature set in CommonJS format, references to imported symbols are always made to a child property, e.g.

    import foo from 'bar';
    console.log(foo.text)

is transformed to 

    var _foo = require('bar');
    var _foo2 = defaultExportInterop(_foo);

    console.log(_foo2["default"].text)

This makes degugging difficult, since source maps are not currently capable of mapping symbol names.

This feature may not be useful to some people, especially given that it didn't exist with CommonJS modules, so this plugin was created to give developers the option to sacrifice a feature that they may never use for the sake of preserving symbol names in the compiled code. This code with `babel-plugin-transform-es2015-modules-commonjs-simple` becomes:

    var _foo = require('bar');
    var foo = defaultExportInterop(_foo).default;

    console.log(foo.text)


## Using it

If you are using a preset, it probably already includes `babel-plugin-transform-es2015-commonjs`. You can most likely get away with just adding this plugin to your config:

    {
        "presets": ["es2015"],
        "plugins": "babel-plugin-transform-es2015-modules-commonjs-simple"
    }

This does not actually override the existing plugin - they both run. But, Babel runs the plugins from your local configuration before presets, so the module will already be transformed, meaning that there will be nothing to do when the module transform from the preset runs.

So this may not be perfectly efficient - but it should be safe. The only other alternative would be to create your own preset that excludes the CommonJS transformer.


## Installation

```sh
$ npm install babel-plugin-transform-es2015-modules-commonjs
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["transform-es2015-modules-commonjs"]
}
```

### Via CLI

```sh
$ babel --plugins transform-es2015-modules-commonjs script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["transform-es2015-modules-commonjs"]
});
```
