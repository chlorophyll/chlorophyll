<template>
    <div class="container">
        <div class="panel inline top-controls">
            <div class="control-row">
                <button class="square highlighted material-icons" @click="play">
                    {{ runText }}
                </button>
                <div class="square" />
                <button class="square material-icons">skip_previous</button>
                <button class="square material-icons">stop</button>
                <button class="square material-icons">skip_next</button>

            </div>
        </div>
        <div class="list-container panel">
            <ul class="playlist">
                <draggable
                    class="draggable"
                    v-model="playlistItems"
                    @change="onPlaylistItemChanged"
                    :options="playlistOptions">
                <playlist-item v-for="item in playlistItems" :current="item === currentPlaylistItem" :key="item.id" :item="item" />
            </draggable>
            </ul>
            <div class="patterns flat-list">
                <ul>
                    <draggable
                        v-model="pattern_list"
                        :options="patternlistOptions"
                        :clone="createPlaylistItem">
                    <li v-for="pattern in pattern_list" :key="pattern.id">
                        {{pattern.name}}
                    </li>
                    </draggable>
                </ul>
            </div>
        </div>
    </div>
</template>

<script>
import * as THREE from 'three';
import draggable from 'vuedraggable';
import store, {newgid} from 'chl/vue/store';
import { currentModel } from 'chl/model';
import { mapGetters } from 'vuex';
import viewports from 'chl/viewport';
import PlaylistItem from './playlist_item';
import PlaylistRunner from '@/common/patterns/playlist';
import {RunState} from 'chl/patterns/preview';
import {bindFramebufferInfo} from 'twgl.js';

export default {
    name: 'playlist-editor',
    store,
    components: { draggable, PlaylistItem },
    data() {
        return {
            playlistItems: [],
            runstate: RunState.Stopped,
            request_id: null,
            runner: null,
            currentIndex: null,
        };
    },
    mounted() {
        this.runner = this.makePlaylistRunner(this.playlistItems);
    },
    computed: {
        ...mapGetters('pattern', [
            'pattern_list',
        ]),
        ...mapGetters('mapping', [
            'mapping_list',
        ]),
        ...mapGetters('pixels', [
            'group_list',
        ]),
        playlistOptions() {
            return {
                group: 'playlist',
                sort: true,
                handle: '.drag',
            };
        },
        patternlistOptions() {
            return {
                sort: false,
                group: {
                    name: 'playlist',
                    pull: 'clone',
                    put: false,
                    revertClone: true,
                },
            };
        },
        runText() {
            return this.running ? 'pause' : 'play_arrow';
        },
        running() {
            return this.runstate === RunState.Running;
        },
        currentPlaylistItem() {
            return this.playlistItems[this.currentIndex];
        },

        step() {
            const outputTexture = new THREE.Texture();
            const runner = this.runner;
            const {renderer} = viewports.getViewport('main');
            return () => {
                const {texture} = this.runner.step();
                const properties = renderer.properties.get(outputTexture);
                properties.__webglTexture = texture;
                properties.__webglInit = true;
                bindFramebufferInfo(renderer.getContext(), null);
                renderer.state.reset();
                currentModel.setFromTexture(outputTexture);
            }
        }
    },
    beforeDestroy() {
        this.stop();
    },
    methods: {
        makePlaylistRunner(items) {
            const {renderer} = viewports.getViewport('main');
            const gl = renderer.getContext();
            const model =  currentModel;
            const group = this.group_list[0];
            const mapping = this.mapping_list[0];
            const crossfadeDuration = 5*60;
            const runner = new PlaylistRunner({
                gl,
                model,
                group,
                mapping,
                playlistItems: this.playlistItems,
                crossfadeDuration,
                onCurrentChanged: (val) => this.onCurrentChanged(val),
            });
            bindFramebufferInfo(gl, null);
            renderer.state.reset();
            return runner;
        },
        onCurrentChanged(val) {
            this.currentIndex = val;
            const {renderer} = viewports.getViewport('main');
            const gl = renderer.getContext();
            bindFramebufferInfo(gl, null);
            renderer.state.reset();
        },
        createPlaylistItem(pattern) {
            return {
                id: newgid(),
                pattern,
                duration: 20,
            };
        },
        onPlaylistItemChanged(evt) {
            const {shouldStop, curIndex} = this.runner.onPlaylistChanged(evt, this.playlistItems);
            if (shouldStop && this.running) {
                this.stop();
            }
        },
        run() {
            this.step();
            if (this.running) {
                this.request_id = window.requestAnimationFrame(() => this.run());
            }
        },
        pause() {
            this.runstate = RunState.Paused;
            if (this.request_id !== null) {
                window.cancelAnimationFrame(this.request_id);
            }
            this.request_id = null;
        },
        stop() {
            this.runstate = RunState.Stopped;
            this.pause();
            currentModel.display_only = false;
            this.runner.setCurrent(0);
        },
        play() {
            this.runstate = RunState.Running;
            currentModel.display_only = true;
            this.run();
        },
    }
};
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";

.container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
}

.top-controls {
    flex: initial;
}

.list-container {
    flex: 1;
    display: flex;
    align-items: stretch;

    .patterns {
        width: 220px;
    }

    .flat-list {
        height: auto;
    }

    .playlist {
        flex: 1;
        position: relative;
        ul {
            height: 100%;
        }

        .draggable {
            height: 100%;
        }
    }

}
</style>
