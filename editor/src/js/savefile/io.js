import * as fs from 'fs';
import * as tar from 'tar-stream';
import * as concatStream from 'concat-stream';

import { remote } from 'electron';
import schemas, { SchemaDefs } from 'chl/schemas';

import { importNewModel, modelPreview, currentModel } from 'chl/model';
import { createNewMapping } from 'chl/mapping';
import * as nodeRegistry from '@/common/nodes/registry.js';

import store from 'chl/vue/store';

import { createSaveObject, restoreSaveObject } from 'chl/savefile';
import { pushRecentFile } from 'chl/savefile/recent';
import { createStockResources } from 'chl/savefile/project';
import importOBJ from './obj';

// Promisified in Electron 5+ but patched in until we upgrade.
const validateSchema = schemas.getSchema(SchemaDefs.definition('chlorophyllSavefile'));
const validateModel = schemas.getSchema(SchemaDefs.object('model'));

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
        pushRecentFile(path, {preview: out.model});
        store.commit('set_current_save_path', path);
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

function validateSave(path, version, content) {
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

    return obj;

}

function readSaveFileAsync(path) {
    return new Promise(function(resolve, reject) {
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
            reject(err);
        });

        extract.on('finish', () => {
            try {
                resolve({version, content});
            } catch (err) {
                reject(err);
            }
        });
        fs.createReadStream(path).pipe(extract);
    });
}

export async function test() {
    return 1;
}

export async function readSavefile(path) {
    const {version, content} = await readSaveFileAsync(path);
    const obj = validateSave(path, version, content);

    // TODO(cwill) use an event emitter or listener to handle triggers on file load
    nodeRegistry.refreshFromSavedState(obj);
    restoreSaveObject(obj);
    createStockResources(store, path);

    pushRecentFile(path, {preview: obj.model});
    store.commit('set_current_save_path', path);
}

export async function previewSavefile(path) {
    const {version, content} = await readSaveFileAsync(path);
    const obj = validateSave(path, version, content);
    return modelPreview(obj);
}

function importModelFile(path, options) {
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

        importNewModel(obj, options);
        createStockResources(store);

        store.commit('set_current_save_path', null);
    });
}

export function showOpenDialog() {
    remote.dialog.showOpenDialog({
        filters: [
            { name: 'Chlorophyll project file', extensions: ['chl'] }
        ],
        multiSelections: false,
    }, (filenames) => {
        if (filenames === undefined)
            return;
        readSavefile(filenames[0]);
    });
}

export function showSaveAsDialog() {
    remote.dialog.showSaveDialog({
        filters: [
            { name: 'Chlorophyll project file', extensions: ['chl'] }
        ]
    }, writeSavefile);
}

export function showImportDialog(format = 'chl') {
    let exts = [];
    if (format && format === 'obj')
        exts = ['obj', 'json'];
    else
        exts = ['ledmap', 'json'];

    remote.dialog.showOpenDialog({
        filters: [
            { name: 'Model file', extensions: exts }
        ]
    }, async (filenames) => {
        if (filenames === undefined)
            return;

        const action = await promptReplace();
        if (action === 'cancel') {
            console.log('Cancelled import.');
            return;
        }
        const opts = {
            newProject: action === 'new'
        };

        switch (format) {
            case 'chl': {
                return importModelFile(filenames[0], opts);
            }

            case 'obj': {
                try {
                    const {strips, uvCoords} = await importOBJ(filenames[0]);
                    console.log('Loading strip data:', strips);
                    const newProject = action === 'new';
                    importNewModel({strips}, {newProject});
                    // TODO handle multiple maps
                    createNewMapping('uv', 'Imported UV map', {
                        uvCoords,
                        dimension: 2
                    });
                    createStockResources(store);
                } catch (e) {
                    console.error('Error during import:', e);
                }
                return;
            }

            default:
                throw new Error('invalid load format');
        }
    });
}

export function saveCurrentProject() {
    if (store.state.current_save_path !== null) {
        writeSavefile(store.state.current_save_path);
    } else {
        showSaveAsDialog();
    }
}

async function promptReplace() {
    if (!currentModel)
        return 'new';

    return new Promise(resolve => {
        remote.dialog.showMessageBox({
            type: 'question',
            title: 'Import New Project',
            message: [
                'A project is already open.',
                'Start a new project with the imported model, or replace the current project\'s model?'
            ].join('\n'),
            buttons: ['Create New Project', 'Replace Current Model', 'Cancel'],
            defaultId: 0,
            cancelId: 2,
        }, response => {
            console.log('DIALOG RESPONSE', response);
            const options = ['new', 'replace', 'cancel'];
            return resolve(options[response]);
        });
    });
}
