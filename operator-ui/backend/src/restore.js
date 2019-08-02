import * as fs from 'fs';
import * as tar from 'tar-stream';
import concatStream from 'concat-stream';

import * as nodeRegistry from '@/common/nodes/registry';
import { restoreAllGroups } from '@/common/model';
import { restoreAllMappings } from '@/common/mapping';
import { restoreAllPatterns, restorePlaylistItems } from '@/common/patterns';

import { restoreAllGraphs } from './graphlib';

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

function restoreSaveObject(obj) {
    let state = {};
    nodeRegistry.refreshFromSavedState(state);

    state.hardware = obj.hardwareSettings;

    state.mappings = restoreAllMappings(obj.mappings).new_mappings;
    const patternObj = restoreAllPatterns(obj.patterns);
    state.patterns = patternObj.new_patterns;
    state.patternOrder = patternObj.new_pattern_ordering;
    const g = restoreAllGroups(obj.groups);
    state.groups = g.new_groups;
    state.group_list = g.new_group_list;
    state.model = new Model(obj.model, state.groups);
    state.playlistItems = restorePlaylistItems(obj.playlistItems);

    restoreAllGraphs(obj.graphs);

    return state;
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

    // let result = validateSchema(obj);

    // if (!result) {
    //     console.error(validateSchema.errors);
    //     throw new Error(msg);
    // }

    return restoreSaveObject(obj);
}

export function readSavefile(path) {
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
                let res = restoreSave(path, version, content);
                resolve(res);
            } catch (err) {
                extract.emit('error', err);
            }
        });

        fs.createReadStream(path).pipe(extract);
    });
}
