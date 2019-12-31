import * as fs from 'fs';
import * as path from 'path';
import * as tar from 'tar-stream';
import concatStream from 'concat-stream';

import * as nodeRegistry from '@/common/nodes/registry';
import { restoreAllGroups } from '@/common/model';
import { restoreAllMappings } from '@/common/mapping';
import { restoreAllPatterns } from '@/common/patterns';

import { restoreAllGraphs } from './graphlib';
import { restoreAllPlaylists, savePlaylists} from './playlist';
import Model from './model';

//xxx hacks
//

const SAVE_VERSION = '1';

function stringStream(next, cb) {
    return concatStream({encoding: 'string'}, (val) => {
        cb(val);
        next();
    });
}

function restoreSaveObject(obj, projectDir) {
    let state = {};
    nodeRegistry.refreshFromSavedState(obj);

    state.hardware = obj.hardwareSettings;
    state.next_guid = obj.next_guid;

    state.mappings = restoreAllMappings(obj.mappings).new_mappings;
    const patternObj = restoreAllPatterns(obj.patterns);
    state.patterns = patternObj.new_patterns;
    state.patternOrder = patternObj.new_pattern_ordering;
    const g = restoreAllGroups(obj.groups);
    state.groups = g.new_groups;
    state.group_list = g.new_group_list;
    state.model = new Model(obj.model, state.groups);

    const playlistObj = restoreAllPlaylists(obj.playlists);

    state.playlistsById = playlistObj.playlistsById;
    state.playlistOrder = playlistObj.playlistOrder;

    state.obj = obj;

    restoreAllGraphs(obj.graphs, projectDir);

    return state;
}

function restoreSave(filepath, version, content) {
    const msg = `${filepath} is not a valid Chlorophyll project file.`;

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

    // let result = validateSchema(obj);

    // if (!result) {
    //     console.error(validateSchema.errors);
    //     throw new Error(msg);
    // }

    const projectDir = path.dirname(filepath);
    return restoreSaveObject(obj, projectDir);
}

export function readSavefile(filepath) {
    return new Promise((resolve, reject) => {
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
                let res = restoreSave(filepath, version, content);
                resolve(res);
            } catch (err) {
                extract.emit('error', err);
            }
        });

        fs.createReadStream(filepath).pipe(extract);
    });
}

export function writeSavefile(filepath, state) {
    return new Promise((resolve, reject) => {
        const playlists = savePlaylists(state);
        const mergedState = {
            ...state.obj,
            next_guid: state.next_guid,
            playlists,
        };
        const contents = JSON.stringify(mergedState);

        const pack = tar.pack();
        pack.entry({'name': 'version'}, SAVE_VERSION);
        pack.entry({'name': 'data'}, contents);
        pack.finalize();

        const fstream = fs.createWriteStream(filepath);
        fstream.on('close', () => resolve());
        fstream.on('error', err => reject(err));
        pack.pipe(fstream);
    });
}
