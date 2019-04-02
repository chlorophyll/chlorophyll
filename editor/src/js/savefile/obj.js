import * as THREE from 'three';
import 'three-examples/loaders/OBJLoader';
import 'three-examples/loaders/SVGLoader';

import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';
import { remote } from 'electron';

console.log(Promise);

const parseJSON = Promise.method(JSON.parse);
const readFile = Promise.promisify(fs.readFile);

export default async function importOBJ(filename) {
    const match = /\.(\w+)$/.exec(filename);
    /*
     * Initial version of UV-mapped pixels.
     * Load an OBJ and an SVG file, then UV-map any paths in the SVG file onto
     * the provided mesh.
     *
     * OBJ files should be one object per file; any after the first will be ignored.
     */
    if (match && match[1] === 'json')
        return readFile(filename)
            .then(data => parseJSON(data))
            .then(index => {
                if (!index || !index.segments)
                    throw new Error('Could not find "segments" array in JSON file');

                const allFiles = index.segments.map(seg => {
                    const workingDir = path.dirname(filename);
                    console.log(`Looking for ${seg.model} and ${seg.pixels} in ${workingDir}`);
                    return Promise.all([
                        loadObjFile(path.resolve(workingDir, seg.model)),
                        loadSvgFile(path.resolve(workingDir, seg.pixels))
                    ]);
                });
                return Promise.all(allFiles);
            })
            .then(files => {
                let strips = [];
                files.forEach(([obj, svg]) => {
                    strips = strips.concat(uvMapStrips(obj, svg));
                });
                return {strips};
            })
            .error(err => {
                remote.dialog.showErrorBox('Error importing model', err.message);
                return null;
            });

    return loadObjFile(filename)
        .then(objData => {
            return blatPixels(objData);
        })
        .error(err => {
            remote.dialog.showErrorBox('Error importing model', err.message);
            return null;
        });
}

/*
 * 3d math.
 */
function uvMapStrips(obj, svg) {
    const geom = new THREE.Geometry();
    geom.fromBufferGeometry(obj.children[0].geometry);
    // Each path in the SVG file becomes an LED strip.
    const strips = svg.map(shapePath => {
        const stripPixels = [];
        shapePath.subPaths.forEach(path =>
            path.curves.forEach(curve => {
                if (curve.type !== 'LineCurve')
                    throw new Error(`Unsupported curve type: ${curve.type}; expected: LineCurve`);

                stripPixels.push(curve.v1, curve.v2);
            })
        );
        // Each path segment will likely overlap the previous one at a vertex.
        // Remove adjacent duplicates.
        const deduped = stripPixels.filter((pt, i, pts) => i === 0 || pt.equals(pts[i - 1]));

        // Apply pixels to the mesh.
        return deduped.map(pt => uvMapPixel(geom, pt));
    });

    return strips;
}

function uvMapPixel(geometry, pt) {
    // First, find the triangle containing the point.
    const uvPos = new THREE.Vector3(pt.x, pt.y, 0);
    const uvTris = geometry.faceVertexUvs[0].map(f =>
        new THREE.Triangle(
            new THREE.Vector3(f[0].x, f[0].y, 0),
            new THREE.Vector3(f[1].x, f[1].y, 0),
            new THREE.Vector3(f[2].x, f[2].y, 0),
        )
    );

    const i = uvTris.findIndex(tri => {
        console.log(tri);
        return tri.containsPoint(uvPos);
    });
    if (i < 0) {
        console.warn('Pixel UV coordinates not found on mesh', uvPos, geometry);
        return null;
    }

    // Map the coordinates within the found triangle from UV to world coordinates
    const uvTri = uvTris[i];
    const tri = new THREE.Triangle(
        geometry.vertices[geometry.faces[i].a],
        geometry.vertices[geometry.faces[i].b],
        geometry.vertices[geometry.faces[i].c],
    );

    return interpolateInTriangle(uvPos, uvTri, tri);
}

function interpolateInTriangle(uvPos, uvTri, tri) {
    console.log(uvPos, uvTri, tri);
    const baryPos = new THREE.Vector3();
    tri.getBarycoord(uvPos, baryPos);

    const interpolated = new THREE.Vector3(0, 0, 0);
    interpolated.addScaledVector(tri.a, baryPos.x);
    interpolated.addScaledVector(tri.b, baryPos.y);
    interpolated.addScaledVector(tri.c, baryPos.z);

    return interpolated;
}

/*
 * File loading.
 */
async function loadObjFile(filename) {
    const loader = new THREE.OBJLoader();
    return loadWithThreeLoader(filename, loader);
}

async function loadSvgFile(filename) {
    const loader = new THREE.SVGLoader();
    return loadWithThreeLoader(filename, loader);
}

async function loadWithThreeLoader(filename, loader) {
    // Need to construct a promise because of THREE loader's weird callback style.
    return new Promise((resolve, reject) => {
        fs.readFile(filename, (err, data) => {
            if (err)
                return reject(err);

            loader.load(
                'data:application/octet-stream;base64,' + data.toString('base64'),
                result => resolve(result),
                xhr => {},
                err => reject(err)
            );
        });
    });
}

/*
 * Hacky method for demo model import.
 * Load the mesh, then use a raytracer with an orthogonal viewport to project
 * approximately the right density of points onto it.
 */
function blatPixels(objectGroup) {
    const zrange = [0, 0];
    const strips = objectGroup.children.map(obj => {
        console.log('processing:', obj);
        const settings = settingsForObject(obj);
        const bbox = new THREE.Box3().setFromObject(obj);
        const originPlane = bbox.min[settings.axis] - 1;

        if (bbox.min.z < zrange[0])
            zrange[0] = bbox.min.z;
        if (bbox.max.z > zrange[1])
            zrange[1] = bbox.max.z;

        obj.material.side = THREE.DoubleSide;
        const raycaster = new THREE.Raycaster();
        const swz =
            settings.axis === 'x' ? ['y', 'z'] :
            settings.axis === 'y' ? ['x', 'z'] :
            ['y', 'x'];

        const pixels = [];
        let offsetRow = false;
        for (let i = bbox.min[swz[0]]; i < bbox.max[swz[0]]; i += settings.spacing) {
            for (let j = bbox.min[swz[1]]; j < bbox.max[swz[1]]; j += settings.spacing) {

                const pos = new THREE.Vector3(0, 0, 0);
                pos[settings.axis] = originPlane;
                pos[swz[0]] = i;
                pos[swz[1]] = j + (offsetRow ? settings.spacing / 2 : 0);

                raycaster.set(pos, settings.rayDirection);
                const ints = raycaster.intersectObject(obj);
                ints.forEach(int => pixels.push(int.point.toArray()));
            }
            offsetRow = !offsetRow;
        }
        console.log(`Generated ${pixels.length} pixels for ${obj.name}`);
        return pixels;
    });
    console.log(`Min z ${zrange[0]}, max z ${zrange[1]} -> length ${zrange[1] - zrange[0]}`);

    return {strips};
}

function settingsForObject(object) {
    const settings = {
        spacing: 3,
        axis: 'x',
        rayDirection: new THREE.Vector3(0, 0, 0)
    };

    if (/wing/.test(object.name)) {
        settings.spacing = 1;
        settings.axis = 'z';
    }

    settings.rayDirection[settings.axis] = 1;
    return settings;
}
