import * as THREE from 'three';

let Util = {
    clone: function(obj) {
        // Handle the 3 simple types, and null or undefined
        if (null == obj || 'object' != typeof obj) return obj;

        // Handle Date
        if (obj instanceof Date) {
            let copy = new Date();
            copy.setTime(obj.getTime());
            return copy;
        }

        // Handle Array
        if (obj instanceof Array) {
            let copy = [];
            for (let i = 0, len = obj.length; i < len; i++) {
                copy[i] = Util.clone(obj[i]);
            }
            return copy;
        }

        if (obj.clone) {
            return obj.clone();
        }

        // Handle Object
        if (obj instanceof Object) {
            let copy = {};
            for (let attr in obj) {
                if (obj.hasOwnProperty(attr)) copy[attr] = Util.clone(obj[attr]);
            }
            return copy;
        }

        throw new Error('Unable to copy obj! Its type isn\'t supported.');
    },
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
        return 'rotate('+[THREE.Math.radToDeg(angleRad), origin.x, origin.y].join(',')+')';
    },

    distanceToLine: function(point, line, clamp) {
        if (clamp == undefined) {
            clamp = true;
        }
        let closest = line.closestPointToPoint(point, clamp);
        let ret = closest.sub(point).length();
        return ret;
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
        let sum = new THREE.Vector3();

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

        let dir = new THREE.Vector3();
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
        return new THREE.Plane().setFromNormalAndCoplanarPoint(dir, centroid);
    },

    alignWithVector: function(vec, camera) {
        let radius = camera.position.length();
        let s = new THREE.Spherical().setFromVector3(vec);
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

    Range: function(min, max, lower, upper) {
        this.min = min;
        this.max = max;
        this.lower = lower;
        this.upper = upper;

        this.toString = function() {
            return `${this.lower.toFixed(2)} - ${this.upper.toFixed(2)}`;
        };

        this.serialize = function() {
            return {min: this.min, max: this.max, lower: this.lower, upper: this.upper};
        };

        this.constructor.deserialize = function(obj) {
            return new Util.Range(obj.min, obj.max, obj.lower, obj.upper);
        };
    },

    uniqueName: function(prefix, nameseq) {
        let candidate;
        let taken = true;
        let suffix = nameseq.length || nameseq.size;
        while (taken) {
            candidate = prefix + suffix;
            taken = nameseq.indexOf(candidate) !== -1;
            suffix++;
        }
        return candidate;
    },
};

Util.JSON = {
    tags: {},
    addType: function(tag, constructor) {
        this.tags[tag] = constructor;

        constructor.toJSON = function() {
            return {'_tag': tag};
        };

        constructor.prototype.toJSON = function() {
            return {'_tag': tag, value: this.serialize()};
        };
    },

    normalized: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    reviver: function(key, val) {
        if (val instanceof Object && val._tag) {
            if (val.value !== undefined) {
                return Util.JSON.tags[val._tag].deserialize(val.value);
            } else {
                return Util.JSON.tags[val._tag];
            }
        } else {
            return val;
        }
    },

    denormalized: function(obj) {
        if (null == obj || 'object' != typeof obj) return obj;
        let ret = {};
        if (obj instanceof Array) {
            ret = obj.map(Util.JSON.denormalized);
        } else {
            for (let key in obj) {
                if (obj.hasOwnProperty(key)) {
                    let val = obj[key];

                    if (val instanceof Object)
                        val = Util.JSON.denormalized(val);

                    let result = Util.JSON.reviver(key, val);

                    ret[key] = result;
                }
            }
        }
        return ret;
    },

    dump: function(obj) {
        return JSON.stringify(obj);
    },

    load: function(s) {
        let out = JSON.parse(s, Util.JSON.reviver);
        return out;
    }
};

Util.JSON.addType('Range', Util.Range);

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
