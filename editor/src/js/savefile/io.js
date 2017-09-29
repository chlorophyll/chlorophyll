import * as fs from 'fs';
import * as tar from 'tar-stream';
import * as concatStream from 'concat-stream';

import { remote } from 'electron';
import schemas, { SchemaDefs } from 'chl/schemas';

import { importNewModel } from 'chl/model';

import { createSaveObject, restoreSaveObject } from 'chl/savefile';

let validateSchema = schemas.getSchema(SchemaDefs.definition('chlorophyllSavefile'));
let validateModel = schemas.getSchema(SchemaDefs.object('model'));

const SAVE_VERSION = '1';

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

export function importModelFile(path) {
    fs.readFile(path, (err, data) => {
        if (err) {
            remote.dialog.showErrorBox('Error importing model', err.message);
            return;
        }

        const msg = `${path} is not a valid model file.`;
        let obj;

        try {
            obj = JSON.parse(data);
        } catch (exc) {
            remote.dialog.showErrorBox('Error importing model', msg);
        }

        let result = validateModel(obj);

        if (!result) {
            console.error(validateModel.errors);
            remote.dialog.showErrorBox('Error importing model', msg);
            return;
        }

        importNewModel(obj);
    });
}
