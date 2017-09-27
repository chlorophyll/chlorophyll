import * as fs from 'fs';
import { remote } from 'electron';

let _saveFields = null;

export function registerSaveField(field, fn) {
    if (_saveFields === null)
        _saveFields = new Map();
    _saveFields.set(field, fn);
}

export function getSaveField(field) {
    return _saveFields.get(field);
}

export function createSaveObject() {
    let out = {};
    for ([field, fn] of _saveFields) {
        out[field] = fn();
    }
    return out;
}

export function writeSavefile(path) {
    let out = createSaveObject();

    let contents = JSON.stringify(out);

    console.log(`Trying to write file ${path}`);

    fs.writeFile(path, contents, (err) => {
        if (err !== null) {
            remote.dialog.showErrorBox('Error saving file', err.message);
        }
    });
}
