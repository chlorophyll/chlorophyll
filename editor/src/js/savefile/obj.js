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
            object => done(null, object),
            xhr => {},
            err => done(err)
        );
    });
}
