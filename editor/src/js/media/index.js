import Vue from 'vue';
import * as path from 'path';
import * as fs from 'fs';
import chokidar from 'chokidar';

import store from 'chl/vue/store';

store.registerModule('media', {
    namespaced: true,
    state: {
        folder: '',
        files: {},
    },

    mutations: {
        setFolder(state, folder) {
            state.folder = folder;
        },
        add(state, {filePath}) {
            Vue.set(state.files, filePath, true);
        },
        remove(state, {filePath}) {
            Vue.delete(state.files, filePath);
        },

        clear(state) {
            state.files = {};
        }
    },

    getters: {
        relativePaths(state) {
            return Object.keys(state.files).map(
                filePath => path.relative(state.folder, filePath)
            );
        }
    }
});

let watcher;

export function watchMediaFiles(store, savePath) {
    store.commit('media/clear');

    if (!savePath) {
        return;
    }

    const mediaFolder = path.join(path.dirname(savePath), 'media');

    if (!fs.existsSync(mediaFolder)) {
        fs.mkdirSync(mediaFolder);
    }

    store.commit('media/setFolder', mediaFolder);

    if (watcher) {
        watcher.close();
    }

    watcher = chokidar.watch(mediaFolder);

    watcher.on('add', filePath => store.commit('media/add', {filePath}));
    watcher.on('unlink', filePath => store.commit('media/unlink', {filePath}));

    const watched = watcher.getWatched();

    for (const [dir, children] of Object.entries(watched)) {
        for (const child of children) {
            const filePath = path.join(dir, child);
            if (watched[filePath] === undefined) {
                store.commit('media/add', {filePath});
            }
        }
    }
}
