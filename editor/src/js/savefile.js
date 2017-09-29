import * as fs from 'fs';
import { remote } from 'electron';

import schemas, { SchemaDefs } from 'chl/schemas';

let validateSchema = schemas.getSchema(SchemaDefs.definition('chlorophyllSavefile'));

let _saveFields = null;

export function registerSaveField(field, { save, restore }) {
    if (_saveFields === null)
        _saveFields = new Map();
    _saveFields.set(field, { save, restore });
}

export function getSaveField(field) {
    return _saveFields.get(field);
}

export function createSaveObject() {
    let out = {};
    for ([field, { save }] of _saveFields) {
        out[field] = save();
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

function restoreSaveObject(obj) {
    for ([field, { restore }] of _saveFields) {
        restore(obj[field]);
    }
}

export function readSavefile(path) {
    fs.readFile(path, (err, data) => {
        if (err !== null) {
            remote.dialog.showErrorBox('Error opening file', err.message);
            return;
        }
        let obj;
        const msg = `${path} is not a valid Chlorophyll project file.`;
        try {
            obj = JSON.parse(data);
        } catch (exc) {
            remote.dialog.showErrorBox('Error opening file', msg);
            console.error(exc);
            return;
        }

        let result = validateSchema(obj);

        if (!result) {
            remote.dialog.showErrorBox('Error opening file', msg);
            console.error(validateSchema.errors);
            return;
        }

        restoreSaveObject(obj);
    });
}
