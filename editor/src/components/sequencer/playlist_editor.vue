<template>
    <div class="container">
        <div class="panel inline top-controls">
            <div class="control-row">
                <button class="square highlighted material-icons" @click="togglePlay">
                    {{ runText }}
                </button>
                <div class="square" />
                <button @click="previous" class="square material-icons">skip_previous</button>
                <button @click="stop" class="square material-icons">stop</button>
                <button @click="next" class="square material-icons">skip_next</button>
                <div v-if="running" class="topline-text"><div>{{remainingTimeFormatted}}</div></div>
            </div>
        </div>
        <div class="list-container panel" @click="selectPlaylistItem(null)">
            <ul class="playlist">
                <draggable
                    class="draggable"
                    v-model="playlistItems"
                    :options="playlistOptions">
                <template v-for="(item, index) in playlistItems">
                <playlist-item
                    :current="item === currentPlaylistItem"
                    :index="index"
                    :selected="item === selected"
                    @click.native.stop="selectPlaylistItem(item)"
                    :key="item.id"
                    :item="item" />
                </template>
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
import * as numeral from 'numeral';
import _ from 'lodash';
import draggable from 'vuedraggable';
import store, {newgid} from 'chl/vue/store';
import { currentModel } from 'chl/model';
import { mappingUtilsMixin } from 'chl/mapping';
import { patternUtilsMixin } from 'chl/patterns';
import { mapState, mapGetters } from 'vuex';
import viewports from 'chl/viewport';
import PlaylistItem from './playlist_item';
import PlaylistRunner from '@/common/patterns/playlist';
import {RunState} from 'chl/patterns/preview';
import {bindFramebufferInfo} from 'twgl.js';

export default {
    name: 'playlist-editor',
    store,
    components: { draggable, PlaylistItem },
    mixins: [mappingUtilsMixin, patternUtilsMixin],
    data() {
        return {
            runstate: RunState.Stopped,
            request_id: null,
            runner: null,
            currentIndex: null,
            currentTime: 0,
            selected: null,
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
        ...mapState({
            playlistState: state => state.playlists.playlistItems,
        }),

        playlistItems: {
            get() {
                return this.playlistState.map(item => {
                    const patternId = item.pattern;
                    const mappingId = item.mapping;
                    const groupId = item.group;
                    const {id, duration} = item;
                    const pattern = this.getPattern(patternId);
                    const mapping = this.getMapping(mappingId);
                    const group = this.getGroup(groupId);
                    return {id, duration, pattern, mapping, group};
                });
            },
            set(val) {
                const stateItems = val.map(item => ({
                    pattern: item.pattern.id,
                    group: item.group.id,
                    mapping: item.mapping !== null ? item.mapping.id : null,
                    id: item.id,
                    duration: item.duration
                }));
                this.$store.commit('playlists/update', stateItems);
            },
        },
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
        stopped() {
            return this.runstate === RunState.Stopped;
        },
        currentPlaylistItem() {
            return this.stopped ? undefined : this.playlistItems[this.currentIndex];
        },
        currentDuration() {
            return this.stopped ? undefined : this.currentPlaylistItem.duration;
            return this.currentPlaylistItem.duration;
        },
        currentRemaining() {
            return this.currentDuration - this.currentTime;
        },
        remainingTimeFormatted() {
            const minutes = numeral(this.currentRemaining / 60).format('00');
            const seconds = numeral(this.currentRemaining % 60).format('00.0');
            return `${minutes}:${seconds}`;
        },
        outputTexture() {
            return new THREE.Texture();
        },
        firstPlaylistItemForPlayback() {
            if (this.selected === null) {
                return 0;
            } else {
                return this.playlistItems.findIndex(el => el === this.selected);
            }
        },

        step() {
            const runner = this.runner;
            const {renderer} = viewports.getViewport('main');
            return () => {
                if (!this.running) {
                    console.log('step returning');
                    return;
                }
                const {texture, curTime} = this.runner.step();
                const properties = renderer.properties.get(this.outputTexture);
                properties.__webglTexture = texture;
                properties.__webglInit = true;
                this.glReset();
                currentModel.setFromTexture(this.outputTexture);
                return curTime;
            }
        }
    },
    beforeDestroy() {
        this.stop();
    },
    watch: {
        playlistItems: {
            handler(newval) {
                const {shouldStop} = this.runner.onPlaylistChanged(this.playlistItems);
                this.glReset();
                if (shouldStop && this.running) {
                    this.stop();
                }
            },
            deep: true,
        },
    },
    methods: {
        makePlaylistRunner(items) {
            const {renderer} = viewports.getViewport('main');
            const gl = renderer.getContext();
            const model =  currentModel;
            const crossfadeDuration = 5*60;
            const runner = new PlaylistRunner({
                gl,
                model,
                playlistItems: this.playlistItems,
                crossfadeDuration,
                onCurrentChanged: (val, curTime) => this.onCurrentChanged(val, curTime),
            });
            this.glReset();
            return runner;
        },
        onCurrentChanged(val, curTime) {
            this.currentIndex = val;
            this.currentTime = curTime;
        },
        createPlaylistItem(pattern) {
            const group = this.group_list[0]; // hack
            const availableMappings = this.mappingsByType[pattern.mapping_type] || [];

            const mapping = availableMappings.length === 1 ? availableMappings[0] : null;
            return {
                id: newgid(),
                pattern,
                group,
                mapping,
                duration: 30,
            };
        },
        glReset() {
            const {renderer} = viewports.getViewport('main');
            const gl = renderer.getContext();
            bindFramebufferInfo(gl, null);
            renderer.state.reset();
        },
        run() {
            const curTime = this.step();
            this.currentTime = curTime;
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
            if (this.runstate === RunState.Stopped) {
                return;
            }
            currentModel.display_only = false;
            this.pause();
            this.runstate = RunState.Stopped;
            window.requestAnimationFrame(() => {
                this.runner.setCurrentRunner(0);
                this.glReset();
            });
        },
        play() {
            this.runner.setCurrentRunner(this.firstPlaylistItemForPlayback);
            this.runstate = RunState.Running;
            currentModel.display_only = true;
            this.run();
        },
        togglePlay() {
            if (this.running) {
                this.pause();
            } else {
                this.play();
            }
        },
        previous() {
            this.runner.previous();
        },
        next() {
            this.runner.next();
        },
        selectPlaylistItem(item) {
            this.selected = item;
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
    position: relative;
}

.topline-text {
    display: flex;
    align-items: center;
    height: 24px;
    padding-left: 1em;
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
