/* eslint max-len:0 */
/**
 * Forked from https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/SVGLoader.js
 * in order to avoid loader kludge, quiet logging and change path visibility behavior.
 *
 * Original authors:
 *
 * @author mrdoob / http://mrdoob.com/
 * @author zz85 / http://joshuakoo.com/
 * @author yomboprime / https://yombo.org
 */
import * as THREE from 'three';

export class SVGLoader {
    constructor(options = {}) {
        this.paths = [];

        this.tempTransform1 = new THREE.Matrix3();
        this.tempTransform2 = new THREE.Matrix3();
        this.tempTransform3 = new THREE.Matrix3();
        this.currentTransform = new THREE.Matrix3();
        this.transformStack = [];

        this.debug = Boolean(options.debug);
        this.includeInvisible = Boolean(options.includeInvisible);
    }

    loadFromUrl(url, onLoad, onProgress, onError) {
        const loader = new THREE.FileLoader(THREE.DefaultLoadingManager);

        loader.load(
            url,
            text => onLoad(this.parse(text)),
            onProgress,
            onError
        );
    }

    parse(text) {
        if (this.debug) {
            console.log('THREE.SVGLoader');
            console.time('THREE.SVGLoader: DOMParser');
        }

        let xml = new DOMParser().parseFromString(text, 'image/svg+xml'); // application/xml

        if (this.debug) {
            console.timeEnd('THREE.SVGLoader: DOMParser');
            console.time('THREE.SVGLoader: Parse');
        }

        this.parseNode(xml.documentElement, {fill: '#000' });

        if (this.debug) {
            console.timeEnd('THREE.SVGLoader: Parse');
        }

        return this.paths;
    }

    parseNode(node, style) {
        if (node.nodeType !== 1) return;

        let transform = this.getNodeTransform(node);
        let path = null;

        switch (node.nodeName) {
            case 'svg':
                break;

            case 'g':
                style = this.parseStyle(node, style);
                break;

            case 'path':
                style = this.parseStyle(node, style);
                if (node.hasAttribute('d') && this.isVisible(style)) path = this.parsePathNode(node, style);
                break;

            case 'rect':
                style = this.parseStyle(node, style);
                if (this.isVisible(style)) path = this.parseRectNode(node, style);
                break;

            case 'polygon':
                style = this.parseStyle(node, style);
                if (this.isVisible(style)) path = this.parsePolygonNode(node, style);
                break;

            case 'polyline':
                style = this.parseStyle(node, style);
                if (this.isVisible(style)) path = this.parsePolylineNode(node, style);
                break;

            case 'circle':
                style = this.parseStyle(node, style);
                if (this.isVisible(style)) path = this.parseCircleNode(node, style);
                break;

            case 'ellipse':
                style = this.parseStyle(node, style);
                if (this.isVisible(style)) path = this.parseEllipseNode(node, style);
                break;

            case 'line':
                style = this.parseStyle(node, style);
                if (this.isVisible(style)) path = this.parseLineNode(node, style);
                break;

            default:
                if (this.debug)
                    console.log(node);
                break;
        }

        if (path) {
            this.transformPath(path, this.currentTransform);
            this.paths.push(path);
        }

        const nodes = node.childNodes;
        for (let i = 0; i < nodes.length; i ++) {
            this.parseNode(nodes[i], style);
        }

        if (transform) {
            this.currentTransform.copy(this.transformStack.pop());
        }
    }

    parsePathNode(node, style) {
        let path = new THREE.ShapePath();
        path.color.setStyle(style.fill);

        let point = new THREE.Vector2();
        let control = new THREE.Vector2();

        let firstPoint = new THREE.Vector2();
        let isFirstPoint = true;
        let doSetFirstPoint = false;

        let d = node.getAttribute('d');

        // console.log(d);

        let commands = d.match(/[a-df-z][^a-df-z]*/ig);

        for (let i = 0, l = commands.length; i < l; i ++) {
            let command = commands[i];

            let type = command.charAt(0);
            let data = command.substr(1).trim();

            if (isFirstPoint) {
                doSetFirstPoint = true;
            }
            isFirstPoint = false;

            switch (type) {
                case 'M': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 2) {
                        point.x = numbers[j + 0];
                        point.y = numbers[j + 1];
                        control.x = point.x;
                        control.y = point.y;
                        if (j === 0) {
                            path.moveTo(point.x, point.y);
                        } else {
                            path.lineTo(point.x, point.y);
                        }
                    }
                    break;
                }

                case 'H': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j ++) {
                        point.x = numbers[j];
                        control.x = point.x;
                        control.y = point.y;
                        path.lineTo(point.x, point.y);
                    }
                    break;
                }

                case 'V': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j ++) {
                        point.y = numbers[j];
                        control.x = point.x;
                        control.y = point.y;
                        path.lineTo(point.x, point.y);
                    }
                    break;
                }

                case 'L': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 2) {
                        point.x = numbers[j + 0];
                        point.y = numbers[j + 1];
                        control.x = point.x;
                        control.y = point.y;
                        path.lineTo(point.x, point.y);
                    }
                    break;
                }

                case 'C': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 6) {
                        path.bezierCurveTo(
                            numbers[j + 0],
                            numbers[j + 1],
                            numbers[j + 2],
                            numbers[j + 3],
                            numbers[j + 4],
                            numbers[j + 5]
                       );
                        control.x = numbers[j + 2];
                        control.y = numbers[j + 3];
                        point.x = numbers[j + 4];
                        point.y = numbers[j + 5];
                    }
                    break;
                }

                case 'S': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 4) {
                        path.bezierCurveTo(
                            this.getReflection(point.x, control.x),
                            this.getReflection(point.y, control.y),
                            numbers[j + 0],
                            numbers[j + 1],
                            numbers[j + 2],
                            numbers[j + 3]
                       );
                        control.x = numbers[j + 0];
                        control.y = numbers[j + 1];
                        point.x = numbers[j + 2];
                        point.y = numbers[j + 3];
                    }
                    break;
                }

                case 'Q': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 4) {
                        path.quadraticCurveTo(
                            numbers[j + 0],
                            numbers[j + 1],
                            numbers[j + 2],
                            numbers[j + 3]
                       );
                        control.x = numbers[j + 0];
                        control.y = numbers[j + 1];
                        point.x = numbers[j + 2];
                        point.y = numbers[j + 3];
                    }
                    break;
                }

                case 'T': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 2) {
                        let rx = this.getReflection(point.x, control.x);
                        let ry = this.getReflection(point.y, control.y);
                        path.quadraticCurveTo(
                            rx,
                            ry,
                            numbers[j + 0],
                            numbers[j + 1]
                       );
                        control.x = rx;
                        control.y = ry;
                        point.x = numbers[j + 0];
                        point.y = numbers[j + 1];
                    }
                    break;
                }

                case 'A': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 7) {
                        let start = point.clone();
                        point.x = numbers[j + 5];
                        point.y = numbers[j + 6];
                        control.x = point.x;
                        control.y = point.y;
                        this.parseArcCommand(
                            path,
                            numbers[j],
                            numbers[j + 1],
                            numbers[j + 2],
                            numbers[j + 3],
                            numbers[j + 4],
                            start,
                            point
                       );
                    }
                    break;
                }

                //

                case 'm': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 2) {
                        point.x += numbers[j + 0];
                        point.y += numbers[j + 1];
                        control.x = point.x;
                        control.y = point.y;
                        if (j === 0) {
                            path.moveTo(point.x, point.y);
                        } else {
                            path.lineTo(point.x, point.y);
                        }
                    }
                    break;
                }

                case 'h': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j ++) {
                        point.x += numbers[j];
                        control.x = point.x;
                        control.y = point.y;
                        path.lineTo(point.x, point.y);
                    }
                    break;
                }

                case 'v': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j ++) {
                        point.y += numbers[j];
                        control.x = point.x;
                        control.y = point.y;
                        path.lineTo(point.x, point.y);
                    }
                    break;
                }

                case 'l': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 2) {
                        point.x += numbers[j + 0];
                        point.y += numbers[j + 1];
                        control.x = point.x;
                        control.y = point.y;
                        path.lineTo(point.x, point.y);
                    }
                    break;
                }

                case 'c': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 6) {
                        path.bezierCurveTo(
                            point.x + numbers[j + 0],
                            point.y + numbers[j + 1],
                            point.x + numbers[j + 2],
                            point.y + numbers[j + 3],
                            point.x + numbers[j + 4],
                            point.y + numbers[j + 5]
                       );
                        control.x = point.x + numbers[j + 2];
                        control.y = point.y + numbers[j + 3];
                        point.x += numbers[j + 4];
                        point.y += numbers[j + 5];
                    }
                    break;
                }

                case 's': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 4) {
                        path.bezierCurveTo(
                            this.getReflection(point.x, control.x),
                            this.getReflection(point.y, control.y),
                            point.x + numbers[j + 0],
                            point.y + numbers[j + 1],
                            point.x + numbers[j + 2],
                            point.y + numbers[j + 3]
                       );
                        control.x = point.x + numbers[j + 0];
                        control.y = point.y + numbers[j + 1];
                        point.x += numbers[j + 2];
                        point.y += numbers[j + 3];
                    }
                    break;
                }

                case 'q': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 4) {
                        path.quadraticCurveTo(
                            point.x + numbers[j + 0],
                            point.y + numbers[j + 1],
                            point.x + numbers[j + 2],
                            point.y + numbers[j + 3]
                       );
                        control.x = point.x + numbers[j + 0];
                        control.y = point.y + numbers[j + 1];
                        point.x += numbers[j + 2];
                        point.y += numbers[j + 3];
                    }
                    break;
                }

                case 't': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 2) {
                        let rx = this.getReflection(point.x, control.x);
                        let ry = this.getReflection(point.y, control.y);
                        path.quadraticCurveTo(
                            rx,
                            ry,
                            point.x + numbers[j + 0],
                            point.y + numbers[j + 1]
                       );
                        control.x = rx;
                        control.y = ry;
                        point.x = point.x + numbers[j + 0];
                        point.y = point.y + numbers[j + 1];
                    }
                    break;
                }

                case 'a': {
                    const numbers = this.parseFloats(data);
                    for (let j = 0, jl = numbers.length; j < jl; j += 7) {
                        let start = point.clone();
                        point.x += numbers[j + 5];
                        point.y += numbers[j + 6];
                        control.x = point.x;
                        control.y = point.y;
                        this.parseArcCommand(
                            path, numbers[j], numbers[j + 1], numbers[j + 2], numbers[j + 3], numbers[j + 4], start, point
                       );
                    }
                    break;
                }

                case 'Z':
                case 'z':
                    path.currentPath.autoClose = true;
                    if (path.currentPath.curves.length > 0) {
                        // Reset point to beginning of Path
                        point.copy(firstPoint);
                        path.currentPath.currentPoint.copy(point);
                        isFirstPoint = true;
                    }
                    break;

                default:
                    if (this.debug)
                        console.warn(command);
            }

            // console.log(type, this.parseFloats(data), parseFloats(data).length )

            if (doSetFirstPoint) {
                firstPoint.copy(point);
                doSetFirstPoint = false;
            }
        }

        return path;
    }

    /**
     * https://www.w3.org/TR/SVG/implnote.html#ArcImplementationNotes
     * https://mortoray.com/2017/02/16/rendering-an-svg-elliptical-arc-as-bezier-curves/ Appendix: Endpoint to center arc conversion
     * From
     * rx ry x-axis-rotation large-arc-flag sweep-flag x y
     * To
     * aX, aY, xRadius, yRadius, aStartAngle, aEndAngle, aClockwise, aRotation
     */

    parseArcCommand(path, rx, ry, x_axis_rotation, large_arc_flag, sweep_flag, start, end) {
        x_axis_rotation = x_axis_rotation * Math.PI / 180;

        // Ensure radii are positive
        rx = Math.abs(rx);
        ry = Math.abs(ry);

        // Compute (x1′, y1′)
        let dx2 = (start.x - end.x) / 2.0;
        let dy2 = (start.y - end.y) / 2.0;
        let x1p = Math.cos(x_axis_rotation) * dx2 + Math.sin(x_axis_rotation) * dy2;
        let y1p = - Math.sin(x_axis_rotation) * dx2 + Math.cos(x_axis_rotation) * dy2;

        // Compute (cx′, cy′)
        let rxs = rx * rx;
        let rys = ry * ry;
        let x1ps = x1p * x1p;
        let y1ps = y1p * y1p;

        // Ensure radii are large enough
        let cr = x1ps / rxs + y1ps / rys;

        if (cr > 1) {
            // scale up rx,ry equally so cr == 1
            let s = Math.sqrt(cr);
            rx = s * rx;
            ry = s * ry;
            rxs = rx * rx;
            rys = ry * ry;
        }

        let dq = (rxs * y1ps + rys * x1ps);
        let pq = (rxs * rys - dq) / dq;
        let q = Math.sqrt(Math.max(0, pq));
        if (large_arc_flag === sweep_flag) q = - q;
        let cxp = q * rx * y1p / ry;
        let cyp = - q * ry * x1p / rx;

        // Step 3: Compute (cx, cy) from (cx′, cy′)
        let cx = Math.cos(x_axis_rotation) * cxp - Math.sin(x_axis_rotation) * cyp + (start.x + end.x) / 2;
        let cy = Math.sin(x_axis_rotation) * cxp + Math.cos(x_axis_rotation) * cyp + (start.y + end.y) / 2;

        // Step 4: Compute θ1 and Δθ
        let theta = this.svgAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
        let delta = this.svgAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (- x1p - cxp) / rx, (- y1p - cyp) / ry) % (Math.PI * 2);

        path.currentPath.absellipse(cx, cy, rx, ry, theta, theta + delta, sweep_flag === 0, x_axis_rotation);
    }

    svgAngle(ux, uy, vx, vy) {
        let dot = ux * vx + uy * vy;
        let len = Math.sqrt(ux * ux + uy * uy) *  Math.sqrt(vx * vx + vy * vy);
        let ang = Math.acos(Math.max(-1, Math.min(1, dot / len))); // floating point precision, slightly over values appear
        if ((ux * vy - uy * vx) < 0) ang = - ang;
        return ang;
    }

    /*
    * According to https://www.w3.org/TR/SVG/shapes.html#RectElementRXAttribute
    * rounded corner should be rendered to elliptical arc, but bezier curve does the job well enough
    */
    parseRectNode(node, style) {
        let x = parseFloat(node.getAttribute('x') || 0);
        let y = parseFloat(node.getAttribute('y') || 0);
        let rx = parseFloat(node.getAttribute('rx') || 0);
        let ry = parseFloat(node.getAttribute('ry') || 0);
        let w = parseFloat(node.getAttribute('width'));
        let h = parseFloat(node.getAttribute('height'));

        let path = new THREE.ShapePath();
        path.color.setStyle(style.fill);
        path.moveTo(x + 2 * rx, y);
        path.lineTo(x + w - 2 * rx, y);
        if (rx !== 0 || ry !== 0) path.bezierCurveTo(x + w, y, x + w, y, x + w, y + 2 * ry);
        path.lineTo(x + w, y + h - 2 * ry);
        if (rx !== 0 || ry !== 0) path.bezierCurveTo(x + w, y + h, x + w, y + h, x + w - 2 * rx, y + h);
        path.lineTo(x + 2 * rx, y + h);

        if (rx !== 0 || ry !== 0) {
            path.bezierCurveTo(x, y + h, x, y + h, x, y + h - 2 * ry);
        }

        path.lineTo(x, y + 2 * ry);

        if (rx !== 0 || ry !== 0) {
            path.bezierCurveTo(x, y, x, y, x + 2 * rx, y);
        }

        return path;
    }

    parsePolygonNode(node, style) {
        const iterator = (match, a, b) => {
            let x = parseFloat(a);
            let y = parseFloat(b);

            if (index === 0) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }

            index ++;
        };

        let regex = /(-?[\d.?]+)[,|\s](-?[\d.?]+)/g;

        let path = new THREE.ShapePath();
        path.color.setStyle(style.fill);

        let index = 0;

        node.getAttribute('points').replace(regex, iterator);

        path.currentPath.autoClose = true;

        return path;
    }

    parsePolylineNode(node, style) {
        const iterator = (match, a, b) => {
            let x = parseFloat(a);
            let y = parseFloat(b);

            if (index === 0) {
                path.moveTo(x, y);
            } else {
                path.lineTo(x, y);
            }

            index ++;
        };

        let regex = /(-?[\d.?]+)[,|\s](-?[\d.?]+)/g;

        let path = new THREE.ShapePath();
        path.color.setStyle(style.fill);

        let index = 0;

        node.getAttribute('points').replace(regex, iterator);

        path.currentPath.autoClose = false;

        return path;
    }

    parseCircleNode(node, style) {
        let x = parseFloat(node.getAttribute('cx'));
        let y = parseFloat(node.getAttribute('cy'));
        let r = parseFloat(node.getAttribute('r'));

        let subpath = new THREE.Path();
        subpath.absarc(x, y, r, 0, Math.PI * 2);

        let path = new THREE.ShapePath();
        path.color.setStyle(style.fill);
        path.subPaths.push(subpath);

        return path;
    }

    parseEllipseNode(node, style) {
        let x = parseFloat(node.getAttribute('cx'));
        let y = parseFloat(node.getAttribute('cy'));
        let rx = parseFloat(node.getAttribute('rx'));
        let ry = parseFloat(node.getAttribute('ry'));

        let subpath = new THREE.Path();
        subpath.absellipse(x, y, rx, ry, 0, Math.PI * 2);

        let path = new THREE.ShapePath();
        path.color.setStyle(style.fill);
        path.subPaths.push(subpath);

        return path;
    }

    parseLineNode(node, style) {
        let x1 = parseFloat(node.getAttribute('x1'));
        let y1 = parseFloat(node.getAttribute('y1'));
        let x2 = parseFloat(node.getAttribute('x2'));
        let y2 = parseFloat(node.getAttribute('y2'));

        let path = new THREE.ShapePath();
        path.moveTo(x1, y1);
        path.lineTo(x2, y2);
        path.currentPath.autoClose = false;

        return path;
    }

    //

    parseStyle(node, style) {
        style = Object.assign({}, style); // clone style

        if (node.hasAttribute('fill')) style.fill = node.getAttribute('fill');
        if (node.style.fill !== '') style.fill = node.style.fill;

        return style;
    }

    isVisible(style) {
        if (this.includeInvisible)
            return true;

        const hasFill = style.fill !== 'none' && style.fill !== 'transparent';
        const hasStroke = style.stroke !== 'none' && style.stroke !== 'transparent';

        return hasFill || hasStroke;
    }

    // http://www.w3.org/TR/SVG11/implnote.html#PathElementImplementationNotes

    getReflection(a, b) {
        return a - (b - a);
    }

    parseFloats(string) {
        let array = string.split(/[\s,]+|(?=\s?[+-])/);

        for (let i = 0; i < array.length; i ++) {
            let number = array[i];

            // Handle values like 48.6037.7.8
            // TODO Find a regex for this

            if (number.indexOf('.') !== number.lastIndexOf('.')) {
                let split = number.split('.');

                for (let s = 2; s < split.length; s ++) {
                    array.splice(i + s - 1, 0, '0.' + split[s]);
                }
            }

            array[i] = parseFloat(number);
        }

        return array;

    }

    getNodeTransform(node) {
        if (! node.hasAttribute('transform')) {
            return null;
        }

        let transform = this.parseTransformNode(node);

        if (transform) {
            if (this.transformStack.length > 0) {
                transform.premultiply(this.transformStack[this.transformStack.length - 1]);
            }

            this.currentTransform.copy(transform);
            this.transformStack.push(transform);
        }

        return transform;
    }

    parseTransformNode(node) {
        let transformAttr = node.getAttribute('transform');
        let transform = null;
        let openParPos = transformAttr.indexOf('(');
        let closeParPos = transformAttr.indexOf(')');

        if (openParPos > 0 && openParPos < closeParPos) {
            let transformType = transformAttr.substr(0, openParPos);

            let array = this.parseFloats(transformAttr.substr(openParPos + 1, closeParPos - openParPos - 1));

            switch (transformType) {
                case 'translate':

                    if (array.length >= 1) {
                        transform = new THREE.Matrix3();

                        let tx = array[0];
                        let ty = tx;

                        if (array.length >= 2) {
                            ty = array[1];
                        }

                        transform.translate(tx, ty);
                    }

                    break;

                case 'rotate':

                    if (array.length >= 1) {
                        let angle = 0;
                        let cx = 0;
                        let cy = 0;

                        transform = new THREE.Matrix3();

                        // Angle
                        angle = - array[0] * Math.PI / 180;

                        if (array.length >= 3) {
                            // Center x, y
                            cx = array[1];
                            cy = array[2];
                        }

                        // Rotate around center (cx, cy)
                        this.tempTransform1.identity().translate(-cx, -cy);
                        this.tempTransform2.identity().rotate(angle);
                        this.tempTransform3.multiplyMatrices(this.tempTransform2, this.tempTransform1);
                        this.tempTransform1.identity().translate(cx, cy);
                        transform.multiplyMatrices(this.tempTransform1, this.tempTransform3);
                    }

                    break;

                case 'scale':

                    if (array.length >= 1) {
                        transform = new THREE.Matrix3();

                        let scaleX = array[0];
                        let scaleY = scaleX;

                        if (array.length >= 2) {
                            scaleY = array[1];
                        }

                        transform.scale(scaleX, scaleY);
                    }

                    break;

                case 'skewX':

                    if (array.length === 1) {
                        transform = new THREE.Matrix3();

                        transform.set(
                            1, Math.tan(array[0] * Math.PI / 180), 0,
                            0, 1, 0,
                            0, 0, 1
                       );
                    }

                    break;

                case 'skewY':

                    if (array.length === 1) {
                        transform = new THREE.Matrix3();

                        transform.set(
                            1, 0, 0,
                            Math.tan(array[0] * Math.PI / 180), 1, 0,
                            0, 0, 1
                       );
                    }

                    break;

                case 'matrix':

                    if (array.length === 6) {
                        transform = new THREE.Matrix3();

                        transform.set(
                            array[0], array[2], array[4],
                            array[1], array[3], array[5],
                            0, 0, 1
                       );
                    }

                    break;
            }
        }

        return transform;
    }

    transformPath(path, m) {
        const transfVec2 = (v2) => {
            tempV3.set(v2.x, v2.y, 1).applyMatrix3(m);

            v2.set(tempV3.x, tempV3.y);
        };

        const isRotated = this.isTransformRotated(m);

        let tempV2 = new THREE.Vector2();
        let tempV3 = new THREE.Vector3();

        let subPaths = path.subPaths;

        for (let i = 0, n = subPaths.length; i < n; i++) {
            let subPath = subPaths[i];
            let curves = subPath.curves;

            for (let j = 0; j < curves.length; j++) {
                let curve = curves[j];

                if (curve.isLineCurve) {
                    transfVec2(curve.v1);
                    transfVec2(curve.v2);
                } else if (curve.isCubicBezierCurve) {
                    transfVec2(curve.v0);
                    transfVec2(curve.v1);
                    transfVec2(curve.v2);
                    transfVec2(curve.v3);
                } else if (curve.isQuadraticBezierCurve) {
                    transfVec2(curve.v0);
                    transfVec2(curve.v1);
                    transfVec2(curve.v2);
                } else if (curve.isEllipseCurve) {
                    if (isRotated) {
                        console.warn('SVGLoader: Elliptic arc or ellipse rotation or skewing is not implemented.');
                    }

                    tempV2.set(curve.aX, curve.aY);
                    transfVec2(tempV2);
                    curve.aX = tempV2.x;
                    curve.aY = tempV2.y;

                    curve.xRadius *= this.getTransformScaleX(m);
                    curve.yRadius *= this.getTransformScaleY(m);
                }
            }
        }
    }

    isTransformRotated(m) {
        return m.elements[1] !== 0 || m.elements[3] !== 0;
    }

    getTransformScaleX(m) {
        let te = m.elements;
        return Math.sqrt(te[0] * te[0] + te[1] * te[1]);
    }

    getTransformScaleY(m) {
        let te = m.elements;
        return Math.sqrt(te[3] * te[3] + te[4] * te[4]);
    }
};
