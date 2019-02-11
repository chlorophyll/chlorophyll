import * as THREE from 'three';
import * as fs from 'fs';
import ObjFile from 'obj-file-parser';

import { remote } from 'electron';

export default function importOBJ(filename, done) {
    return fs.readFile(filename, (err, data) => {
        if (err) {
            remote.dialog.showErrorBox('Error importing model', err.message);
            return;
        }

        const obj = new ObjFile(data.toString());
        const modelData = obj.parse();

        const {faces, vertices} = modelData.models[0];
        console.log(modelData.models);

        return done(null, modelData);
    });
}
