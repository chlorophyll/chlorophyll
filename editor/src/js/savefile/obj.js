import * as THREE from 'three';
import 'three-examples/loaders/OBJLoader';
import * as fs from 'fs';

import { remote } from 'electron';

export default async function importOBJ(filename, done) {
    const match = /\.(\w+)$/.exec(filename);
    if (match && match[1] === 'json') {
        return fs.readFile(filename, (err, data) => {
            if (err) {
                remote.dialog.showErrorBox('Error importing model', err.message);
                return done(err);
            }

            try {
                const index = JSON.parse(data);
                index.segments.forEach(({model, pixels}) => {
                });
            } catch (e) {
                remote.dialog.showErrorBox('Error importing model', e);
                return done(err);
            }
        });
    }

    return loadOBJ(filename, done);
}

function loadOBJ(filename, done) {
    const loader = new THREE.OBJLoader();

    fs.readFile(filename, (err, data) => {
        if (err) {
            remote.dialog.showErrorBox('Error importing model', err.message);
            return done(err);
        }

        loader.load(
            'data:application/octet-stream;base64,' + data.toString('base64'),
            result => done(null, blatPixels(result)),
            xhr => {},
            err => done(err)
        );
    });
}

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
