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
        return path.replaceWith(node);
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

      path.replaceWithMultiple(t.sequenceExpression(nodes));
    }
  };

  return {
    inherits: require("babel-plugin-transform-strict-mode"),

    visitor: {
      ThisExpression: function ThisExpression(path, state) {
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

          function addRequire(source, uid) {

            var cached = requires[source];
            if (cached) return cached;

            var ref = uid ? getIdentifier(uid) : path.scope.generateUidIdentifier((0, _path2.basename)(source, (0, _path2.extname)(source)));

            topNodes.push(t.variableDeclaration("var", [t.variableDeclarator(ref, buildRequire(t.stringLiteral(source)).expression)]));

            return requires[source] = ref;
          }

          function addTo(obj, key, arr) {
            var existing = obj[key] || [];
            obj[key] = existing.concat(arr);
          }
          debugger;
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            for (var _iterator2 = body[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              var _path = _step2.value;

              if (_path.isExportDeclaration()) {
                hasExports = true;

                var specifiers = [].concat(_path.get("declaration"), _path.get("specifiers"));
                var _iteratorNormalCompletion4 = true;
                var _didIteratorError4 = false;
                var _iteratorError4 = undefined;

                try {
                  for (var _iterator4 = specifiers[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var specifier = _step4.value;

                    var ids = specifier.getBindingIdentifiers();
                    if (ids.__esModule) {
                      throw specifier.buildCodeFrameError("Illegal export \"__esModule\"");
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
              }

              if (_path.isImportDeclaration()) {
                hasImports = true;
                addTo(imports, _path.node.source.value, _path.node.specifiers);
                _path.remove();
              } else if (_path.isExportDefaultDeclaration()) {
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
                  _path.replaceWith(buildExportsAssignment(t.identifier("default"), declaration.node));
                }
              } else if (_path.isExportNamedDeclaration()) {
                var declaration = _path.get("declaration");
                if (declaration.node) {
                  if (declaration.isFunctionDeclaration()) {
                    var id = declaration.node.id;
                    addTo(exports, id.name, id);
                    topNodes.push(buildExportsAssignment(id, id));
                    _path.replaceWith(declaration.node);
                  } else if (declaration.isClassDeclaration()) {
                    var id = declaration.node.id;
                    addTo(exports, id.name, id);
                    _path.replaceWithMultiple([declaration.node, buildExportsAssignment(id, id)]);
                    nonHoistedExportNames[id.name] = true;
                  } else if (declaration.isVariableDeclaration()) {
                    var declarators = declaration.get("declarations");
                    var _iteratorNormalCompletion5 = true;
                    var _didIteratorError5 = false;
                    var _iteratorError5 = undefined;

                    try {
                      for (var _iterator5 = declarators[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                        var decl = _step5.value;

                        var id = decl.get("id");

                        var init = decl.get("init");
                        if (!init.node) init.replaceWith(t.identifier("undefined"));

                        if (id.isIdentifier()) {
                          addTo(exports, id.node.name, id.node);
                          init.replaceWith(buildExportsAssignment(id.node, init.node).expression);
                          nonHoistedExportNames[id.node.name] = true;
                        } else {
                          // todo
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

                    _path.replaceWith(declaration.node);
                  }
                  continue;
                }

                var specifiers = _path.get("specifiers");
                if (specifiers.length) {
                  var nodes = [];
                  var source = _path.node.source;
                  if (source) {
                    var ref = addRequire(source.value);

                    var _iteratorNormalCompletion6 = true;
                    var _didIteratorError6 = false;
                    var _iteratorError6 = undefined;

                    try {
                      for (var _iterator6 = specifiers[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var specifier = _step6.value;

                        if (specifier.isExportNamespaceSpecifier()) {
                          // todo
                        } else if (specifier.isExportDefaultSpecifier()) {
                            // todo
                          } else if (specifier.isExportSpecifier()) {
                              topNodes.push(buildExportsFrom(t.stringLiteral(specifier.node.exported.name), t.memberExpression(ref, specifier.node.local)));

                              nonHoistedExportNames[specifier.node.exported.name] = true;
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
                  } else {
                    var _iteratorNormalCompletion7 = true;
                    var _didIteratorError7 = false;
                    var _iteratorError7 = undefined;

                    try {
                      for (var _iterator7 = specifiers[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var specifier = _step7.value;

                        if (specifier.isExportSpecifier()) {
                          addTo(exports, specifier.node.local.name, specifier.node.exported);
                          nonHoistedExportNames[specifier.node.exported.name] = true;
                          nodes.push(buildExportsAssignment(specifier.node.exported, specifier.node.local));
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
                  }
                  _path.replaceWithMultiple(nodes);
                }
              } else if (_path.isExportAllDeclaration()) {
                topNodes.push(buildExportAll({
                  KEY: _path.scope.generateUidIdentifier("key"),
                  OBJECT: addRequire(_path.node.source.value)
                }));
                _path.remove();
              }
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

          for (var source in imports) {
            var specifiers = imports[source];
            if (specifiers.length) {

              var uid = addRequire(source);

              for (var i = 0; i < specifiers.length; i++) {
                var specifier = specifiers[i];
                if (t.isImportNamespaceSpecifier(specifier)) {
                  topNodes.push(t.variableDeclaration("var", [t.variableDeclarator(specifier.local, t.callExpression(this.addHelper("interopRequireWildcard"), [uid]))]));
                } else if (t.isImportDefaultSpecifier(specifier)) {
                  specifiers[i] = t.importSpecifier(specifier.local, t.identifier("default"));
                }
              }

              var _iteratorNormalCompletion3 = true;
              var _didIteratorError3 = false;
              var _iteratorError3 = undefined;

              try {
                for (var _iterator3 = specifiers[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                  var specifier = _step3.value;

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
                      topNodes.push(t.variableDeclaration("var", [t.variableDeclarator(target, t.memberExpression(uid, specifier.imported))]));
                    }

                    if (specifier.local.name !== target.name) {
                      remaps[specifier.local.name] = t.memberExpression(target, specifier.imported);
                    }
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

            topNodes.unshift(t.expressionStatement(hoistedExportsNode));
          }

          // add __esModule declaration if this file has any exports
          if (hasExports && !strict) {
            var buildTemplate = buildExportsModuleDeclaration;
            if (this.opts.loose) buildTemplate = buildLooseExportsModuleDeclaration;
            topNodes.unshift(buildTemplate());
          }

          path.unshiftContainer("body", topNodes);
          path.traverse(reassignmentVisitor, { remaps: remaps, scope: scope, exports: exports });
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

var buildRequire = (0, _babelTemplate2.default)("\n  require($0);\n");

var buildExportsModuleDeclaration = (0, _babelTemplate2.default)("\n  Object.defineProperty(exports, \"__esModule\", {\n    value: true\n  });\n");

var buildExportsFrom = (0, _babelTemplate2.default)("\n  Object.defineProperty(exports, $0, {\n    enumerable: true,\n    get: function () {\n      return $1;\n    }\n  });\n");

var buildLooseExportsModuleDeclaration = (0, _babelTemplate2.default)("\n  exports.__esModule = true;\n");

var buildExportsAssignment = (0, _babelTemplate2.default)("\n  exports.$0 = $1;\n");

var buildExportAll = (0, _babelTemplate2.default)("\n  for (let KEY in OBJECT) {\n    if (KEY === \"default\") continue;\n\n    Object.defineProperty(exports, KEY, {\n      enumerable: true,\n      get: function () {\n        return OBJECT[KEY];\n      }\n    });\n  }\n");

var THIS_BREAK_KEYS = ["FunctionExpression", "FunctionDeclaration", "ClassProperty", "ClassMethod", "ObjectMethod"];