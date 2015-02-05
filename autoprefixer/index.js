'use strict';

var autoprefixer = require('autoprefixer-core');
var path = require('path');
var mixlib = require('mix/lib');

var DEFAULT_CONSTRAINTS = ['last 2 versions', 'ie 9'];

module.exports = function () {
    var constraints = arguments.length > 0 ? Array.prototype.slice.call(arguments) : DEFAULT_CONSTRAINTS;

    return function (tree) {
        var nodes = tree.nodes.map(function (node) {
            var start = new Date();
            var input = node.data.toString('utf8');

            var prevSourceMap = mixlib.tree.sourceMap.get(node);
            var opts = {
                from: node.name,
                map: {
                    prev: prevSourceMap !== undefined ? prevSourceMap : false,
                    sourcesContent: true,
                    annotation: false
                }
            };

            var outputNode;
            try {
                outputNode = mixlib.tree.cloneNode(node);
                var result = autoprefixer({ browsers: constraints }).process(input, opts);
                outputNode.data = new Buffer(result.css, 'utf8');

                var sourceMap = JSON.parse(result.map);
                outputNode = mixlib.tree.sourceMap.set(outputNode, sourceMap, { sourceBase: path.dirname(node.name) });

                mixlib.logger.log('autoprefixer', 'Prefixed ' + node.name, new Date() - start);
            } catch (e) {
                mixlib.logger.error('autoprefixer', e.message);
                outputNode = undefined;
            }
            return outputNode;
        })
        .filter(function (node) {
            return node !== undefined;
        });

        return mixlib.signal.constant(nodes.length > 0 ? mixlib.tree(nodes) : undefined);
    };
};
