'use strict';

var mixlib = require('mix/lib');

module.exports = function () {
    return function (tree) {
        var counter = 0;

        var nodes = tree.nodes.map(function (node) {
            var outputNode = mixlib.tree.sourceMap.unset(node);
            if (outputNode !== node) {
                counter++;
            }
            return outputNode;
        });

        if (counter > 0) {
            mixlib.logger.log('strip-maps', 'Removed ' + counter + ' source maps and comments');
        }

        return mixlib.signal.constant(mixlib.tree(nodes));
    };
};
