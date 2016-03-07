"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var REASSIGN_REMAP_SKIP = Symbol();

  var reassignmentVisitor = {
    ReferencedIdentifier: function ReferencedIdentifier(path) {
      var name = path.node.name;
      var remap = this.remaps[name];
      if (!remap) return;

      // redeclared in this scope
      if (this.scope.getBinding(name) !== path.scope.getBinding(name)) return;

      if (path.parentPath.isCallExpression({ callee: path.node })) {
        path.replaceWith(t.sequenceExpression([t.numericLiteral(0), remap]));
      } else {
        path.replaceWith(remap);
      }
      this.requeueInParent(path);
    },
    AssignmentExpression: function AssignmentExpression(path) {
      var node = path.node;
      if (node[REASSIGN_REMAP_SKIP]) return;

      var left = path.get("left");
      if (!left.isIdentifier()) return;

      var name = left.node.name;
      var exports = this.exports[name];
      if (!exports) return;

      // redeclared in this scope
      if (this.scope.getBinding(name) !== path.scope.getBinding(name)) return;

      node[REASSIGN_REMAP_SKIP] = true;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = exports[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var reid = _step.value;

          node = buildExportsAssignment(reid, node).expression;
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      path.replaceWith(node);
      this.requeueInParent(path);
    },
    UpdateExpression: function UpdateExpression(path) {
      var arg = path.get("argument");
      if (!arg.isIdentifier()) return;

      var name = arg.node.name;
      var exports = this.exports[name];
      if (!exports) return;

      // redeclared in this scope
      if (this.scope.getBinding(name) !== path.scope.getBinding(name)) return;

      var node = t.assignmentExpression(path.node.operator[0] + "=", arg.node, t.numericLiteral(1));

      if (path.parentPath.isExpressionStatement() && !path.isCompletionRecord() || path.node.prefix) {
        path.replaceWith(node);
        this.requeueInParent(path);
        return;
      }

      var nodes = [];
      nodes.push(node);

      var operator = undefined;
      if (path.node.operator === "--") {
        operator = "+";
      } else {
        // "++"
        operator = "-";
      }
      nodes.push(t.binaryExpression(operator, arg.node, t.numericLiteral(1)));

      var newPaths = path.replaceWithMultiple(t.sequenceExpression(nodes));
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = newPaths[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var newPath = _step2.value;
          this.requeueInParent(newPath);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  };

  return {
    inherits: require("babel-plugin-transform-strict-mode"),

    visitor: {
      ThisExpression: function ThisExpression(path, state) {
        // If other plugins run after this plugin's Program#exit handler, we allow them to
        // insert top-level `this` values. This allows the AMD and UMD plugins to
        // function properly.
        if (this.ranCommonJS) return;

        if (state.opts.allowTopLevelThis !== true && !path.findParent(function (path) {
          return !path.is("shadow") && THIS_BREAK_KEYS.indexOf(path.type) >= 0;
        })) {
          path.replaceWith(t.identifier("undefined"));
        }
      },


      Program: {
        exit: function exit(path) {
          var strict = !!this.opts.strict;

          var scope = path.scope;

          // rename these commonjs variables if they're declared in the file

          scope.rename("module");
          scope.rename("exports");
          scope.rename("require");

          var hasExports = false;
          var hasDefaultExport = false;
          var hasNamedExport = false;
          var hasImports = false;

          var body = path.get("body");
          var imports = Object.create(null);
          var exports = Object.create(null);

          var nonHoistedExportNames = Object.create(null);

          var topNodes = [];
          var remaps = Object.create(null);

          var requires = Object.create(null);

          function getIdentifier(name) {
            return {
              name: name,
              type: "Identifier"
            };
          }

          function addRequire(source, blockHoist) {
            var cached = requires[source];
            if (cached) return cached;

            var ref = path.scope.generateUidIdentifier((0, _path2.basename)(source, (0, _path2.extname)(source)));

            var varDecl = t.variableDeclaration("var", [t.variableDeclarator(ref, buildRequire(t.stringLiteral(source)).expression)]);

            if (typeof blockHoist === "number" && blockHoist > 0) {
              varDecl._blockHoist = blockHoist;
            }

            topNodes.push(varDecl);

            return requires[source] = ref;
          }

          function checkExportType(exportName) {
            if (exportName === 'default') {
              hasDefaultExport = true;
            } else {
              hasNamedExport = true;
            }
          }

          function addTo(obj, key, arr) {
            var existing = obj[key] || [];
            obj[key] = existing.concat(arr);
          }

          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            for (var _iterator3 = body[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              var _path = _step3.value;

              if (_path.isExportDeclaration()) {
                hasExports = true;

                var specifiers = [].concat(_path.get("declaration"), _path.get("specifiers"));
                var _iteratorNormalCompletion5 = true;
                var _didIteratorError5 = false;
                var _iteratorError5 = undefined;

                try {
                  for (var _iterator5 = specifiers[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var specifier = _step5.value;

                    var ids = specifier.getBindingIdentifiers();
                    if (ids.__esModule) {
                      throw specifier.buildCodeFrameError("Illegal export \"__esModule\"");
                    }
                  }
                } catch (err) {
                  _didIteratorError5 = true;
                  _iteratorError5 = err;
                } finally {
                  try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                      _iterator5.return();
                    }
                  } finally {
                    if (_didIteratorError5) {
                      throw _iteratorError5;
                    }
                  }
                }
              }

              if (_path.isImportDeclaration()) {
                var _importsEntry$specifi;

                hasImports = true;
                var key = _path.node.source.value;
                var importsEntry = imports[key] || {
                  specifiers: [],
                  maxBlockHoist: 0
                };

                (_importsEntry$specifi = importsEntry.specifiers).push.apply(_importsEntry$specifi, _toConsumableArray(_path.node.specifiers));

                if (typeof _path.node._blockHoist === "number") {
                  importsEntry.maxBlockHoist = Math.max(_path.node._blockHoist, importsEntry.maxBlockHoist);
                }

                imports[key] = importsEntry;

                _path.remove();
              } else if (_path.isExportDefaultDeclaration()) {
                hasDefaultExport = true;
                var declaration = _path.get("declaration");
                if (declaration.isFunctionDeclaration()) {
                  var id = declaration.node.id;
                  var defNode = t.identifier("default");
                  if (id) {
                    addTo(exports, id.name, defNode);
                    topNodes.push(buildExportsAssignment(defNode, id));
                    _path.replaceWith(declaration.node);
                  } else {
                    topNodes.push(buildExportsAssignment(defNode, t.toExpression(declaration.node)));
                    _path.remove();
                  }
                } else if (declaration.isClassDeclaration()) {
                  var id = declaration.node.id;
                  var defNode = t.identifier("default");
                  if (id) {
                    addTo(exports, id.name, defNode);
                    _path.replaceWithMultiple([declaration.node, buildExportsAssignment(defNode, id)]);
                  } else {
                    _path.replaceWith(buildExportsAssignment(defNode, t.toExpression(declaration.node)));
                  }
                } else {
                  // Manualy re-queue `export default foo;` expressions so that the ES3 transform
                  // has an opportunity to convert them. Ideally this would happen automatically from the
                  // replaceWith above. See T7166 for more info.
                  _path.parentPath.requeue(_path.get("expression.left"));
                }
              } else if (_path.isExportNamedDeclaration()) {
                var declaration = _path.get("declaration");
                if (declaration.node) {
                  if (declaration.isFunctionDeclaration()) {

                    var id = declaration.node.id;

                    checkExportType(id.name);
                    addTo(exports, id.name, id);
                    topNodes.push(buildExportsAssignment(id, id));
                    _path.replaceWith(declaration.node);
                  } else if (declaration.isClassDeclaration()) {
                    var id = declaration.node.id;

                    checkExportType(id.name);
                    addTo(exports, id.name, id);
                    _path.replaceWithMultiple([declaration.node, buildExportsAssignment(id, id)]);
                    nonHoistedExportNames[id.name] = true;
                  } else if (declaration.isVariableDeclaration()) {
                    var declarators = declaration.get("declarations");
                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                      for (var _iterator6 = declarators[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var decl = _step6.value;

                        var id = decl.get("id");

                        var init = decl.get("init");
                        if (!init.node) init.replaceWith(t.identifier("undefined"));

                        hasNamedExport = true; // "default" is not a valid symbol name

                        if (id.isIdentifier()) {
                          addTo(exports, id.node.name, id.node);
                          init.replaceWith(buildExportsAssignment(id.node, init.node).expression);
                          nonHoistedExportNames[id.node.name] = true;
                        } else {
                          // todo
                        }
                      }
                    } catch (err) {
                      _didIteratorError6 = true;
                      _iteratorError6 = err;
                    } finally {
                      try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                          _iterator6.return();
                        }
                      } finally {
                        if (_didIteratorError6) {
                          throw _iteratorError6;
                        }
                      }
                    }

                    _path.replaceWith(declaration.node);
                  }
                  continue;
                }

                var specifiers = _path.get("specifiers");
                if (specifiers.length) {
                  var nodes = [];
                  var source = _path.node.source;
                  if (source) {
                    var ref = addRequire(source.value, _path.node._blockHoist);

                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                      for (var _iterator7 = specifiers[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var specifier = _step7.value;

                        if (specifier.isExportNamespaceSpecifier()) {
                          // todo
                        } else if (specifier.isExportDefaultSpecifier()) {
                            // todo
                          } else if (specifier.isExportSpecifier()) {
                              checkExportType(specifier.node.exported.name);

                              if (specifier.node.local.name === "default") {
                                topNodes.push(buildExportsFrom(t.stringLiteral(specifier.node.exported.name), t.memberExpression(t.callExpression(this.addHelper("interopRequireDefault"), [ref]), specifier.node.local)));
                              } else {
                                topNodes.push(buildExportsFrom(t.stringLiteral(specifier.node.exported.name), t.memberExpression(ref, specifier.node.local)));
                              }

                              nonHoistedExportNames[specifier.node.exported.name] = true;
                            }
                      }
                    } catch (err) {
                      _didIteratorError7 = true;
                      _iteratorError7 = err;
                    } finally {
                      try {
                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                          _iterator7.return();
                        }
                      } finally {
                        if (_didIteratorError7) {
                          throw _iteratorError7;
                        }
                      }
                    }
                  } else {
                    var _iteratorNormalCompletion8 = true;
                    var _didIteratorError8 = false;
                    var _iteratorError8 = undefined;

                    try {
                      for (var _iterator8 = specifiers[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var specifier = _step8.value;

                        if (specifier.isExportSpecifier()) {
                          checkExportType(specifier.node.exported.name);
                          addTo(exports, specifier.node.local.name, specifier.node.exported);
                          nonHoistedExportNames[specifier.node.exported.name] = true;
                          nodes.push(buildExportsAssignment(specifier.node.exported, specifier.node.local));
                        }
                      }
                    } catch (err) {
                      _didIteratorError8 = true;
                      _iteratorError8 = err;
                    } finally {
                      try {
                        if (!_iteratorNormalCompletion8 && _iterator8.return) {
                          _iterator8.return();
                        }
                      } finally {
                        if (_didIteratorError8) {
                          throw _iteratorError8;
                        }
                      }
                    }
                  }
                  _path.replaceWithMultiple(nodes);
                }
              } else if (_path.isExportAllDeclaration()) {
                hasNamedExport = true;
                topNodes.push(buildExportAll({
                  OBJECT: addRequire(_path.node.source.value, _path.node._blockHoist)
                }));
                _path.remove();
              }
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3.return) {
                _iterator3.return();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }

          for (var source in imports) {
            var _imports$source = imports[source];
            var specifiers = _imports$source.specifiers;
            var maxBlockHoist = _imports$source.maxBlockHoist;

            if (specifiers.length) {

              var uid = addRequire(source, maxBlockHoist);

              for (var i = 0; i < specifiers.length; i++) {
                var specifier = specifiers[i];

                if (t.isImportNamespaceSpecifier(specifier)) {
                  if (strict) {
                    remaps[specifier.local.name] = uid;
                  } else {
                    var varDecl = t.variableDeclaration("var", [t.variableDeclarator(specifier.local, t.callExpression(this.addHelper("interopRequireWildcard"), [uid]))]);

                    if (maxBlockHoist > 0) {
                      varDecl._blockHoist = maxBlockHoist;
                    }

                    topNodes.push(varDecl);
                  }
                } else if (t.isImportDefaultSpecifier(specifier)) {
                  specifiers[i] = t.importSpecifier(specifier.local, t.identifier("default"));
                }
              }

              var _iteratorNormalCompletion4 = true;
              var _didIteratorError4 = false;
              var _iteratorError4 = undefined;

              try {
                for (var _iterator4 = specifiers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                  var specifier = _step4.value;

                  if (t.isImportSpecifier(specifier)) {
                    var target = uid;
                    if (specifier.imported.name === "default") {
                      target = specifier.local;

                      var requireDefault = this.addHelper("interopRequireDefault");
                      var callExpression = t.callExpression(requireDefault, [uid]);
                      var declaration = t.memberExpression(callExpression, getIdentifier("default"));
                      topNodes.push(t.variableDeclaration("var", [t.variableDeclarator(target, declaration)]));
                    } else {
                      // is a named import

                      target = specifier.local;

                      var varDecl = t.variableDeclaration("var", [t.variableDeclarator(target, t.memberExpression(uid, specifier.imported))]);

                      if (maxBlockHoist > 0) {
                        varDecl._blockHoist = maxBlockHoist;
                      }

                      topNodes.push(varDecl);
                    }

                    if (specifier.local.name !== target.name) {
                      remaps[specifier.local.name] = t.memberExpression(target, t.cloneWithoutLoc(specifier.imported));
                    }
                  }
                }
              } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
              } finally {
                try {
                  if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                  }
                } finally {
                  if (_didIteratorError4) {
                    throw _iteratorError4;
                  }
                }
              }
            } else {
              // bare import
              topNodes.push(buildRequire(t.stringLiteral(source)));
            }
          }

          if (hasImports && Object.keys(nonHoistedExportNames).length) {
            var hoistedExportsNode = t.identifier("undefined");

            for (var name in nonHoistedExportNames) {
              hoistedExportsNode = buildExportsAssignment(t.identifier(name), hoistedExportsNode).expression;
            }

            var node = t.expressionStatement(hoistedExportsNode);
            node._blockHoist = 3;

            topNodes.unshift(node);
          }

          // add __esModule declaration if this file has any exports
          if (hasExports && !strict) {
            var buildTemplate = buildExportsModuleDeclaration;
            if (this.opts.loose) buildTemplate = buildLooseExportsModuleDeclaration;

            var declar = buildTemplate();
            declar._blockHoist = 3;

            topNodes.unshift(declar);
          }

          /*
          console.log({
            "addExports": this.opts.addExports,
            "hasDefaultExport": hasDefaultExport,
            "hasNamedExport": hasNamedExport
          })
          */

          path.unshiftContainer("body", topNodes);

          if (this.opts.addExports && hasDefaultExport && !hasNamedExport) {
            path.pushContainer("body", (0, _babelTemplate2.default)("module.exports = exports['default']")());
          }

          path.traverse(reassignmentVisitor, {
            remaps: remaps,
            scope: scope,
            exports: exports,
            requeueInParent: function requeueInParent(newPath) {
              return path.requeue(newPath);
            }
          });
        }
      }
    }
  };
};

var _path2 = require("path");

var _babelTemplate = require("babel-template");

var _babelTemplate2 = _interopRequireDefault(_babelTemplate);

var _babelTypes = require("babel-types");

var t = _interopRequireWildcard(_babelTypes);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var buildRequire = (0, _babelTemplate2.default)("\n  require($0);\n");

var buildExportsModuleDeclaration = (0, _babelTemplate2.default)("\n  Object.defineProperty(exports, \"__esModule\", {\n    value: true\n  });\n");

var buildExportsFrom = (0, _babelTemplate2.default)("\n  Object.defineProperty(exports, $0, {\n    enumerable: true,\n    get: function () {\n      return $1;\n    }\n  });\n");

var buildLooseExportsModuleDeclaration = (0, _babelTemplate2.default)("\n  exports.__esModule = true;\n");

var buildExportsAssignment = (0, _babelTemplate2.default)("\n  exports.$0 = $1;\n");

var buildExportAll = (0, _babelTemplate2.default)("\n  Object.keys(OBJECT).forEach(function (key) \n    if (key === \"default\") return;\n\n    Object.defineProperty(exports, key, {\n      enumerable: true,\n      get: function () {\n        return OBJECT[key];\n      }\n    });\n  }\n");

var THIS_BREAK_KEYS = ["FunctionExpression", "FunctionDeclaration", "ClassProperty", "ClassMethod", "ObjectMethod"];