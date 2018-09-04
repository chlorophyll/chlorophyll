<template>
<div class="grid-container">
  <div class="playlist panel" @click="selectPlaylistItem(null)">
      <draggable class="draggable" v-model="playlistItems" :options="playlistOptions">
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
  </div>
  <div class="patterns panel">
    <div class="flat-list">
        <ul>
          <draggable
           v-model="pattern_list"
           :options="patternlistOptions"
           :clone="createPlaylistItem">
          <li v-for="pattern in pattern_list" :key="pattern.id">
            <div />
            {{pattern.name}}
          </li>
          </draggable>
        </ul>
    </div>
  </div>
  <div class="topbar panel inline">
    <div class="control-row">
      <button class="square highlighted material-icons" @click="togglePlay">
        {{ runText }}
      </button>
      <div class="square" />
        <button @click="previous" class="square material-icons">skip_previous</button>
        <button @click="stop" class="square material-icons">stop</button>
        <button @click="next" class="square material-icons">skip_next</button>
        <div v-if="running" class="topline-text">
          <div class="square" />
          <div>{{remainingTimeFormatted}}</div>
        </div>
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
    beforeDestroy() {
      this.stop();
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
                ghostClass: 'playlist-item',
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
                return this.playlistItems.findIndex(el => el.id === this.selected.id);
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
        glReset() {
            const {renderer} = viewports.getViewport('main');
            const gl = renderer.getContext();
            bindFramebufferInfo(gl, null);
            renderer.state.reset();
        },
    }
};
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
.grid-container {
    display: grid;
    grid-template-columns: 1fr 220px;
    grid-template-rows: 26px 1fr;
    grid-template-areas: "topbar patterns" "playlist patterns";
    position: absolute;
    height: 100%;
    width: 100%;
    overflow: hidden;
}


.playlist {
    grid-area: playlist;
    overflow: auto;
    height: auto;
    .playlist-item {
        width: 500px;
        height: 3em;
        display: flex;
        align-items: center;
        margin: $control-vspace auto;
        border: 1px solid $panel-light;
        border-radius: $control-border-radius;

        padding: 0.5em;
        div {
            width: 6em;
        }
    }
}

.draggable {
    min-height: 100%;
    height: min-content;
}

.patterns {
    grid-area: patterns;
    height: auto;
    overflow: auto;
    position: relative;

    .flat-list {
        height: calc(100% - 10px);
    }
}

.topbar {
    grid-area: topbar;

    .topline-text {
        height: 26px;
        display: flex;
        align-items: center;
    }

}
</style>
