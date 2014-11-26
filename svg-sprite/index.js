'use strict';

var path = require('path');
var mixlib = require('mix/lib');

var SVG_WRAPPER = '<svg xmlns="http://www.w3.org/2000/svg">#shapes#</svg>';

module.exports = function (options) {
    options = options || {};

    var preserveFill = options.preserveFill || [];

    return function (tree) {
        var symbols = tree.nodes.reduce(function (acc, node) {
            var name = path.basename(node.name, '.svg');
            var shape = node.data.toString('UTF-8');

            var viewBox = /(viewBox="[^"]+")/.exec(shape)[1];

            // Strip doctype and svg element
            shape = shape.replace(/<?xml[^>]>/g, '');
            shape = shape.replace(/<svg[^>]+>|<\/svg>/g, '');

            shape = '<symbol ' + viewBox + ' id="' + name + '">' + shape + '</symbol>';

            // Remove fill attributes, in order to be able to style from CSS
            if (preserveFill.indexOf(name) === -1) {
                shape = shape.replace(/\s*(?:fill|fill-opacity)="[^"]+"/g, '');
            }

            return acc + shape;
        }, '');

        var sprite = SVG_WRAPPER.replace('#shapes#', symbols);
        var fileName = options.dest || 'svg-sprite.svg';

        mixlib.logger.log('svg-sprite', 'Combined ' + tree.nodes.length + ' symbols into ' + fileName);

        return mixlib.tree([{
            base: path.dirname(fileName),
            name: fileName,
            data: new Buffer(sprite, 'utf8'),
            metadata: {
                mime: 'image/svg+xml'
            },
            siblings: []
        }]);
    };
};
