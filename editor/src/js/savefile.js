import * as fs from 'fs';
import * as tar from 'tar-stream';
import * as concatStream from 'concat-stream';

import { remote } from 'electron';

import schemas, { SchemaDefs } from 'chl/schemas';

let validateSchema = schemas.getSchema(SchemaDefs.definition('chlorophyllSavefile'));

const SAVE_VERSION = '1';

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

    let pack = tar.pack();
    pack.entry({'name': 'version'}, SAVE_VERSION);
    pack.entry({'name': 'data'}, contents);
    pack.finalize();

    console.log(`Trying to write file ${path}`);

    let fstream = fs.createWriteStream(path);
    fstream.on('close', () => {
        console.info('done');
    });

    fstream.on('error', (err) => {
        remote.dialog.showErrorBox('Error saving file', err.message);
    });

    pack.pipe(fstream);
}

function restoreSaveObject(obj) {
    for ([field, { restore }] of _saveFields) {
        restore(obj[field]);
    }
}

function stringStream(next, cb) {
    return concatStream({encoding: 'string'}, (val) => {
        cb(val);
        next();
    });
}

function restoreSave(path, version, content) {
    const msg = `${path} is not a valid Chlorophyll project file.`;

    let obj;

    if (version === undefined || content === undefined) {
        throw new Error(msg);
    }

    if (version !== SAVE_VERSION) {
        throw new Error(msg + ' Unsupported version.');
    }

    try {
        obj = JSON.parse(content);
    } catch (exc) {
        throw new Error(msg);
    }

    let result = validateSchema(obj);

    if (!result) {
        console.error(validateSchema.errors);
        throw new Error(msg);
    }

    restoreSaveObject(obj);
}

export function readSavefile(path) {

    let extract = tar.extract();
    let content = '';
    let version = undefined;
    extract.on('entry', (header, stream, next) => {
        if (header.name == 'version') {
            stream.pipe(stringStream(next, (val) => {
                version = val;
            }));
        } else if (header.name == 'data') {
            stream.pipe(stringStream(next, (val) => {
                content = val;
            }));
        }
    });

    extract.on('error', (err) => {
        remote.dialog.showErrorBox('Error opening file', err.message);
    });

    extract.on('finish', () => {
        try {
            restoreSave(path, version, content);
        } catch (err) {
            extract.emit('error', err);
            console.error(err);
        }
    });

    fs.createReadStream(path).pipe(extract);
}
