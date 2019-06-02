import {
    Euler,
    Plane,
    Quaternion,
    Raycaster,
    Vector2,
    Vector3,
} from 'three';

import Units from 'common/units';
import * as T from 'common/types';
import * as mapUtil from './util';

type ProjMode = 'cartesian2d' | 'polar2d';

export default class ProjectionMapping implements T.PixelMapping {
    static readonly className = 'projection';
    readonly className = 'projection';
    static readonly displayName = '2D Projection';
    readonly displayName = '2D Projection';

    public settings = {
        origin: [0, 0, 0],
        plane_angle: [0, 0],
        rotation: 0
    };

    static readonly views = [
        {
            className: 'cartesian2d',
            displayName: '2D Cartesian',
            coords: [
                {name: 'x', unit: Units.Distance},
                {name: 'y', unit: Units.Distance}
            ],
            glslType: 'vec2',
            glslSwizzle: 'xy'
        },
        {
            className: 'polar2d',
            displayName: '2D Polar',
            coords: [
                {name: 'r', unit: Units.Distance},
                {name: 'theta', unit: Units.Angle}
            ],
            glslType: 'vec2',
            glslSwizzle: 'xy',
            convertCoords(point) {
                // map from x,y -> r, theta
                return new Vector2(point.length(), point.angle());
            }
        }
    ];

    constructor(attrs) {
        this.settings = {
            ...this.settings,
            ...attrs
        };
    }

    getView(className: ProjMode): T.MapMode {
        return ProjectionMapping.views.find(m => m.className === className);
    }

    mapPixels(pixels: Array<T.Pixel>, mode: ProjMode): Array<T.MappedPixel> {
        // The camera looks along the negative Z axis, so that's the initial
        // facing direction of the projection plane.
        const [ex, ey] = this.settings.plane_angle;
        const origin = new Vector3().fromArray(this.settings.origin);

        const planeNormal = new Vector3(0, 0, -1);
        const rot = new Quaternion();
        rot.setFromEuler(new Euler(ex, ey, 0, 'XYZ'));
        planeNormal.applyQuaternion(rot);

        const up = new Vector3(0, 1, 0);
        const yaxis = up.applyQuaternion(rot);
        yaxis.applyAxisAngle(planeNormal, this.settings.rotation).normalize();

        const xaxis = planeNormal.clone().cross(yaxis).normalize();

        const mapped = pixels.map((px, i) => {
            const fromOrigin = px.pos.clone().sub(origin);

            let mappedPos = new Vector2(xaxis.dot(fromOrigin), yaxis.dot(fromOrigin));
            if (mode === 'polar2d')
                mappedPos = new Vector2(mappedPos.length(), mappedPos.angle());

            return {idx: i, pos: mappedPos};
        });

        const ret = mapUtil.normalizePositions(mapped, this.getView(mode).coords);
        return ret;
    }

    /*
     * Modifying & config methods
     */
    projectFromCamera(camera, screenOrigin) {
        camera.updateMatrixWorld();

        // Create plane orthogonal to the camera's look vector
        const planeQuat = camera.quaternion.clone();
        const planeEuler = new Euler().setFromQuaternion(planeQuat);
        const planeNormal = new Vector3(0, 0, -1);
        planeNormal.applyQuaternion(planeQuat).normalize();

        // Project the screen position of the origin widget onto the projection
        // plane.  This is the 3d position of the mapping origin.
        const plane = new Plane(planeNormal);
        const {x, y, angle} = screenOrigin;
        const raycaster = new Raycaster();
        const intersection = new Vector3(0, 0, 0);

        raycaster.setFromCamera(new Vector2(x, y), camera);
        raycaster.ray.intersectPlane(plane, intersection);

        this.settings = {
            origin: intersection.toArray(),
            plane_angle: planeEuler.toArray().slice(0, 2),
            rotation: angle,
        };
    }

    /*
     * Serialization
     */

    serialize() {
        return this.settings;
    }

    static deserialize(attrs) {
        return new ProjectionMapping(attrs);
    }

};
