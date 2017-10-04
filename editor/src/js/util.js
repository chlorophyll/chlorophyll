import {
    Math as ThreeMath,
    Plane,
    Spherical,
    Vector3,
} from 'three';

import { addSerializableType } from '@/common/util/serialization';

let _scratchCanvas = null;

let Util = {
    map: function(value, fromLow, fromHigh, toLow, toHigh) {
        return (value - fromLow) * (toHigh - toLow) / (fromHigh - fromLow) + toLow;
    },
    clamp: function(val, min, max) {
        if (val < min)
            val = min;
        if (val > max)
            val = max;
        return val;
    },
    bezierByH: function(x0, y0, x1, y1) {
        let lead_len = Math.min(20, Math.abs(y1 - y0) / 5 + 5);
        if (x0 > x1)
            lead_len = -lead_len;
        const mx = x0 + (x1 - x0) / 2;

        return `M ${x0} ${y0} `
             + `C ${mx + lead_len} ${y0} ${mx - lead_len} ${y1} ${x1} ${y1} `;
    },
    rotateTransform: function(angleRad, origin) {
        return 'rotate('+[ThreeMath.radToDeg(angleRad), origin.x, origin.y].join(',')+')';
    },

    distanceToLine: function(point, line, clamp) {
        if (clamp == undefined) {
            clamp = true;
        }
        let closest = line.closestPointToPoint(point, clamp);
        let ret = closest.sub(point).length();
        return ret;
    },

    offset(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + document.body.scrollTop,
            left: rect.left + document.body.scrollLeft
        };
    },

    relativeCoords: function relativeCoords(element, pageX, pageY) {
        let de = document.documentElement;
        let box = element.getBoundingClientRect();
        let top = box.top + window.pageYOffset - de.clientTop;
        let left = box.left + window.pageXOffset - de.clientLeft;

        return {
            x: pageX - left,
            y: pageY - top
        };
    },

    normalizedCoords: function(camera, renderer, position) {
        let vector = position.clone();
        vector.project(camera);
        vector.z = 0;
        return vector;
    },

    cameraPlaneCoords: function(camera, renderer, position) {
        let vector = position.clone();
        let width = renderer.domElement.clientWidth;
        let height = renderer.domElement.clientHeight;

        // map to normalized device coordinate (NDC) space
        vector.project( camera );

        vector.x = (   vector.x + 1 ) * width  / 2;
        vector.y = ( - vector.y + 1 ) * height / 2;

        vector.z = 0;
        return vector;
    },

    centroid: function(points) {
        let sum = new Vector3();

        for (let i = 0; i < points.length; i++) {
            sum.add(points[i]);
        }
        return sum.divideScalar(points.length);
    },

    // Code based on http://www.ilikebigbits.com/blog/2015/3/2/plane-from-points
    bestFitPlane: function(points) {
        let centroid = Util.centroid(points);

        // Calc full 3x3 covariance matrix, excluding symmetries:
        let xx = 0.0, xy = 0.0, xz = 0.0;
        let yy = 0.0, yz = 0.0, zz = 0.0;

        for (let i = 0; i < points.length; i++) {
            let r = points[i].clone().sub(centroid);
            xx += r.x * r.x;
            xy += r.x * r.y;
            xz += r.x * r.z;
            yy += r.y * r.y;
            yz += r.y * r.z;
            zz += r.z * r.z;
        }
        let det_x = yy*zz - yz*yz;
        let det_y = xx*zz - xz*xz;
        let det_z = xx*yy - xy*xy;

        let det_max = Math.max(det_x, det_y, det_z);

        let dir = new Vector3();
        if (det_max == det_x) {
            let a = (xz*yz - xy*zz) / det_x;
            let b = (xy*yz - xz*yy) / det_x;
            dir.set(1.0, a, b);
        } else if (det_max == det_y) {
            let a = (yz*xz - xy*zz) / det_y;
            let b = (xy*xz - yz*xx) / det_y;
            dir.set(a, 1.0, b);
        } else {
            let a = (yz*xy - xz*yy) / det_z;
            let b = (xz*xy - yz*xx) / det_z;
            dir.set(a, b, 1.0);
        }
        dir.normalize();
        return new Plane().setFromNormalAndCoplanarPoint(dir, centroid);
    },

    alignWithVector: function(vec, camera) {
        let radius = camera.position.length();
        let s = new Spherical().setFromVector3(vec);
        s.radius = radius;
        s.makeSafe();
        camera.position.setFromSpherical(s);
    },

    hilightElement: function(elem) {
        elem.__saved_background = elem.style.background;
        elem.style.background = 'transparent ' +
            'linear-gradient(#ed5f0e, #b7551d) repeat scroll 0px 0px';
    },

    unhilightElement: function(elem) {
        elem.style.background = elem.__saved_background;
        delete elem.saved_background;
    },

    uniqueName: function(prefix, objlist) {
        const names = objlist.map(({name}) => name);
        let candidate;
        let taken = true;
        let suffix = names.length;
        while (taken) {
            candidate = prefix + suffix;
            taken = names.indexOf(candidate) !== -1;
            suffix++;
        }
        return candidate;
    },
    textWidth: function(text, font) {
        if (_scratchCanvas === null) {
            _scratchCanvas = document.createElement('canvas').getContext('2d');
        }
        _scratchCanvas.font = font;
        return _scratchCanvas.measureText(text).width;
    },
    colorString(colorcode) {
        const hex = (n, i) => (n>> (i*8) & 0xff).toString(16).padStart(2, '0');

        let r = hex(colorcode, 2);
        let g = hex(colorcode, 1);
        let b = hex(colorcode, 0);

        return '#'+r+g+b;
    },
    copyName(name) {
        const re = / \(copy (\d+)\)$/;
        const result = re.exec(name);
        if (!result) {
            return `${name} (copy 1)`;
        }
        const copydigits = parseInt(result[1])+1;
        const prefix = name.substring(0, result.index);
        return `${prefix} (copy ${copydigits})`;
    }
};

Util.EventDispatcher = function() {
    this.addEventListener = function(type, callback) {
        if (this._listeners === undefined) {
            this._listeners = {};
        }
        if (!(type in this._listeners)) {
            this._listeners[type] = [];
        }
        this._listeners[type].push(callback);
    };

    this.removeEventListener = function(type, callback) {
        if (this._listeners === undefined) {
            this._listeners = {};
        }
        if (!(type in this._listeners)) {
            return;
        }
        let stack = this._listeners[type];
        for (let i = 0, l = stack.length; i < l; i++) {
            if (stack[i] === callback) {
                stack.splice(i, 1);
                return;
            }
        }
    };

    this.dispatchEvent = function(event) {
        if (this._listeners === undefined || !(event.type in this._listeners)) {
            return true;
        }
        let stack = this._listeners[event.type];
        for (let i = 0, l = stack.length; i < l; i++) {
            stack[i].call(this, event);
        }
        return !event.defaultPrevented;
    };
};

export default Util;

export function UniqueNameMixin(objtype, getter) {
    return {
        methods: {
            [`unique${objtype}Name`]() {
                let namelist = this.$store.getters[getter].map((obj) => obj.name);
                return Util.uniqueName(objtype+' ', namelist);
            }
        }
    };
}

