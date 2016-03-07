# babel-plugin-transform-es2015-modules-commonjs-simple

Presets in babel are implemented as any other module. You can also just define them directly in your project, e.g.

    my-project/
       babel-presets/
           my-es2015-preset
              index.js

You can start by just copying `index.js` from the default [babel-preset-es2015](https://github.com/babel/babel/blob/master/packages/babel-preset-es2015/index.js) module, and change the module transformer. As of version 6.6.0 it might look like this:

    module.exports = {
      plugins: [
        require("babel-plugin-transform-es2015-template-literals"),
        require("babel-plugin-transform-es2015-literals"),
        require("babel-plugin-transform-es2015-function-name"),
        require("babel-plugin-transform-es2015-arrow-functions"),
        require("babel-plugin-transform-es2015-block-scoped-functions"),
        require("babel-plugin-transform-es2015-classes"),
        require("babel-plugin-transform-es2015-object-super"),
        require("babel-plugin-transform-es2015-shorthand-properties"),
        require("babel-plugin-transform-es2015-duplicate-keys"),
        require("babel-plugin-transform-es2015-computed-properties"),
        require("babel-plugin-transform-es2015-for-of"),
        require("babel-plugin-transform-es2015-sticky-regex"),
        require("babel-plugin-transform-es2015-unicode-regex"),
        require("babel-plugin-check-es2015-constants"),
        require("babel-plugin-transform-es2015-spread"),
        require("babel-plugin-transform-es2015-parameters"),
        require("babel-plugin-transform-es2015-destructuring"),
        require("babel-plugin-transform-es2015-block-scoping"),
        require("babel-plugin-transform-es2015-typeof-symbol"),
        
        // replaces babel-plugin-transform-es2015-modules-commonjs
        // note the "default" after the require -- for some reason you can't actually compile babel modules without them being exported 
        // as "default" with the regular babeb commonjs transform, yet the official babel modules themselves don't export "default". 
        // This one does -- so you need to refer to ".default" when requiring it.
        
        [require("babel-plugin-transform-es2015-modules-commonjs-simple").default, {
            noMangle: true,
            addExports: true
        }],
        [require("babel-plugin-transform-regenerator"), { async: false, asyncGenerators: false }],
      ]
    };

Then in your `.babelrc`:

    {
        "presets": ["./babel-presets/my-es2015-preset"],
        "noMangle": true,
        "sourceMaps": true
    }

Make sure you include `babel-preset-es2015` as a dev dependency of your project, too, so all the babel plugins above are installed.
