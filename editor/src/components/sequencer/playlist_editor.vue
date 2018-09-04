<template>
    <div class="container panel">
        <div class="top-bar">topbar</div>
        <div class="list-container">
            <div class="playlist">
                <draggable class="draggable" v-model="playlistItems" :options="playlistOptions">
                <playlist-item v-for="item in playlistItems" :key="item.id" :item="item" />
            </draggable>
            </div>
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
import draggable from 'vuedraggable';
import store from 'chl/vue/store';
import { mapGetters } from 'vuex';

import PlaylistItem from './playlist_item';

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
        }
    },
    methods: {
        createPlaylistItem(pattern) {
            return {
                pattern,
                duration: 60,
            };
        }
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

.top-bar {
    flex: 0 1;
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