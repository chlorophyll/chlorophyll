import * as THREE from 'three';
import 'three-examples/loaders/OBJLoader';
import * as fs from 'fs';

import { remote } from 'electron';

export default function importOBJ(filename, done) {
    const loader = new THREE.OBJLoader();

    fs.readFile(filename, (err, data) => {
        if (err) {
            remote.dialog.showErrorBox('Error importing model', err.message);
            return;
        }

        loader.load(
            'data:application/octet-stream;base64,' + data.toString('base64'),
            result => done(null, blatPoints(result)),
            xhr => {},
            err => done(err)
        );
    });
}

function blatPoints(objectGroup) {
    const strips = objectGroup.children.map(obj => {
        console.log('processing:', obj);
        const settings = settingsForObject(obj);
        const bbox = new THREE.Box3().setFromObject(obj);
        console.log('min:', bbox.min.toArray());
        console.log('max:', bbox.max.toArray());
    });

    return {strips};
}

function settingsForObject(object) {
    const settings = {
        spacing: 3,
        axis: 'x',
        rayDirection: new THREE.Vector3(0, 0, 0)
    };

    if (/sides/.test(object.name))
        settings.axis = 'y';

    if (/wing/.test(object.name)) {
        settings.spacing = 1;
        settings.axis = 'z';
    }

    settings.rayDirection[settings.axis] = 1;
    return settings;
}
