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
                <draggable class="draggable" v-model="playlistItems" :options="playlistOptions">
                <playlist-item v-for="item in playlistItems" :key="item.id" :item="item" />
            </draggable>
            </ul>
            <div class="patterns flat-list">
                <ul>
                    <draggable v-model="pattern_list" :options="patternlistOptions" :clone="createPlaylistItem">
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
import store from 'chl/vue/store';
import { currentModel } from 'chl/model';
import { mapGetters } from 'vuex';
import viewports from 'chl/viewport';
import PlaylistItem from './playlist_item';
import RawPatternRunner from '@/common/patterns/runner';
import Crossfader from '@/common/patterns/crossfade';
import {bindFramebufferInfo} from 'twgl.js';

export default {
    name: 'playlist-editor',
    store,
    components: { draggable, PlaylistItem },
    data() {
        return {
            playlistItems: [],
        };
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
            return 'play_arrow';
        }
    },
    methods: {
        createPlaylistItem(pattern) {
            return {
                pattern,
                duration: 10,
            };
        },
        play() {
            const {renderer} = viewports.getViewport('main');
            const gl = renderer.getContext();
            const model =  currentModel;
            const group = this.group_list[0];
            const mapping = this.mapping_list[0];
            const firstItem = this.playlistItems[0];
            const secondItem = this.playlistItems[1];
            const first = new RawPatternRunner(
                gl,
                model,
                firstItem.pattern,
                group,
                mapping
            );
            const second = new RawPatternRunner(
                gl,
                model,
                secondItem.pattern,
                group,
                mapping,
            );
            //debugger;

            let t = 0;

            let crossfadeStart = (firstItem.duration - 2.5) * 60;
            let crossfadeDuration = 5*60;
            let crossfadeEnd = crossfadeStart + crossfadeDuration;

            let crossfader = new Crossfader(gl, model.num_pixels, 1, crossfadeDuration);

            const outputTexture = new THREE.Texture();

            function step() {
                //const texture = first.step(t);
                let texture;
                if (t < crossfadeStart) {
                    texture = first.step(t);
                } else if (t < crossfadeEnd) {
                    const source = first.step(t);
                    const target = second.step(t - crossfadeStart);
                    texture = crossfader.step(
                        t - crossfadeStart,
                        source,
                        target
                    );
                } else {
                    texture = second.step(t - crossfadeStart);
                }
                const properties = renderer.properties.get(outputTexture);
                properties.__webglTexture = texture;
                properties.__webglInit = true;
                bindFramebufferInfo(gl, null);
                renderer.state.reset();
                model.setFromTexture(outputTexture);
                t++;
                window.requestAnimationFrame(step);
            }
            model.display_only = true;
            step();
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
