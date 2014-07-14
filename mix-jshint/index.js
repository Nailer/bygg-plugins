'use strict';

var RcLoader = require('rcloader');
var jshint = require('jshint').JSHINT;
var jshintCli = require('jshint/src/cli');
var jshintStylish = require(require('jshint-stylish'));
var mix = require('mix');
var mixIn = require('mout/object/mixIn');
var path = require('path');

module.exports = function (options) {
    options = mixIn({ browser: true }, options || {});

    var rcLoader = new RcLoader('.jshintrc', options, {
        loader: function (path) {
            var config = jshintCli.loadConfig(path);
            delete config.dirname;
            return config;
        }
    });

    return function (tree) {
        return new mix.Stream(function (sink) {
            var result = [];
            var remaining = tree.nodes.length;

            tree.nodes.forEach(function (node) {
                var filePath = path.join(node.base, node.name);
                rcLoader.for(filePath, function (err, config) {
                    if (!err) {
                        var globals = {};

                        if (config.globals) {
                            globals = config.globals;
                            delete config.globals;
                        }

                        if (config.overrides) {
                            Object.keys(config.overrides).forEach(function (pattern) {
                                if (minimatch(filePath, pattern, { matchBase: true, nocase: true })) {
                                    var options = config.overrides[pattern];

                                    if (options.globals) {
                                        mixIn(globals, options.globals);
                                        delete options.globals;
                                    }

                                    mixIn(config, options);
                                }
                            });
                            delete config.overrides;
                        }

                        var success = jshint(node.data.toString('utf8'), config, globals);
                        if (!success) {
                            Array.prototype.push.apply(result, jshint.errors.map(function (err) {
                                return {
                                    file: node.name,
                                    error: err
                                };
                            }));
                        }
                    } else {
                        console.log(err);
                    }

                    if (--remaining === 0) {
                        jshintStylish.reporter(result, {});
                        sink.close(tree);
                    }
                });
            });
        });
    };
};