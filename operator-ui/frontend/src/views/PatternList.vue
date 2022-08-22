<template>
  <v-container
    fluid
    grid-list-md
    pa-2
    fill-height
    ref="container"
    v-resize="onResize"
  >
    <v-snackbar color="info" v-model="snackbar" top :timeout="6000">
      {{ snackbarMessage }}
      <v-btn text @click="snackbar = false">
        Close
      </v-btn>
    </v-snackbar>
    <preview-card
      v-if="previewPattern"
      :width="columnWidth"
      :pattern="previewPattern"
      :size="size*1.25"
      :renderer="renderer"
      :loader="loader"
    />
    <v-layout>
      <v-flex xs12 md6 ref="column">
        <v-container :style="scrollStyle" class="overflow-y-auto">
          <v-layout wrap>
          <draggable
            v-model="patternList"
            handle=".handle"
            class="layout wrap"
            :sort="false"
            :group="{ name: 'patterns', pull: 'clone', put: false }"
          >
            <template v-for="(pattern, index) in patternList">
              <v-flex xs12 :key="`pattern${pattern.id}`">
              <pattern-card
                :pattern="pattern"
                :size="size"
                :renderer="renderer"
                :loader="loader"
                @click="selectPreviewItem(pattern)"
                :draggable="true"
                />
              </v-flex>
            </template>
          </draggable>
          </v-layout>
        </v-container>
      </v-flex>
      <v-flex hidden-sm-and-down md6>
        <v-layout class="mx-2">
          <v-flex>
            <v-text-field label="Playlist Name" v-model="playlistName" />
          </v-flex>
          <v-divider vertical inset class="mx-2" />
          <v-flex shrink>
            <v-menu offset-y>
              <template v-slot:activator="{ on }">
                <v-btn icon v-on="on"><v-icon>mdi-dots-vertical</v-icon></v-btn>
              </template>
              <v-list dense>
                <v-list-item @click="newPlaylistIfPossible">
                  <v-list-item-icon><v-icon>mdi-playlist-plus</v-icon></v-list-item-icon>
                  <v-list-item-content>New Playlist</v-list-item-content>
                </v-list-item>
                <v-list-item>
                  <v-list-item-icon><v-icon color="red" class="text-darken-4">mdi-delete</v-icon></v-list-item-icon>
                  <v-list-item-content class="red--text text-darken-4">Delete Playlist</v-list-item-content>
                </v-list-item>
                <v-divider v-if="playlists.length > 0" />
                <v-list-item-group v-model="activePlaylistIndex">
                  <v-list-item v-for="playlist in playlists" :key="playlist.id">
                    <v-list-item-content>{{ playlist.name }}</v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
            </v-menu>
          </v-flex>
        </v-layout>
        <v-divider />
        <v-container ref="playlistContainer" :style="playlistContainerStyle" class="overflow-y-auto">
          <draggable
            :list="activePlaylist"
            :animation="100"
            handle=".handle"
            class="layout wrap align-content-start"
            :style="playlistStyle"
            @update="onMove"
            @add="onAdd"
            :swap-threshold="0.2"
            :empty-insert-threshold="32"
            :group="{name: 'patterns', pull: false, put: true}"
          >
            <template v-for="(playlistItem, index) in activePlaylist">
              <v-flex xs12 :key="playlistItem.id">
                <playlist-card
                  :index="index"
                  :playlist-item="playlistItem"
                  :size="size"
                  :renderer="renderer"
                  :loader="loader"
                  :draggable="true"
                  :editable="true"
                  @close="onClose(playlistItem, index)"
                />
              </v-flex>
            </template>
          </draggable>
        </v-container>
        <v-container style="dropZoneStyle">
          <draggable v-model="dropZone" :group="{name: 'patterns', pull: false, put: true}">
          </draggable>
        </v-container>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import {mapState, mapGetters, mapMutations, mapActions} from 'vuex';
import diffMatchPatch from 'diff-match-patch';
import jsondiff from 'json0-ot-diff';
import * as THREE from 'three';
import store from '@/store';
import api from '@/api';
import PreviewCard from '@/components/PreviewCard';
import PatternCard from '@/components/PatternCard';
import PlaylistCard from '@/components/PlaylistCard';
import draggable from 'vuedraggable';
import * as realtime from '@/realtime';
function ease(t, b, c, d) {
	t /= d;
	return c*t*t*t + b;
}
export default {
  store,
  components: { PatternCard, PreviewCard, PlaylistCard, draggable },
  name: 'PatternList',
  beforeRouteEnter(to, from, next) {
    if (store.state.canAccessSettings) {
      next();
    } else {
      next({
        name: 'login',
        query: {redirectFrom: to.fullPath},
      });
    }
  },
  computed: {
    ...mapState([
      'patternsById',
      'patternOrder',
      'mappingsById',
      'previewItem',
      'realtime',
    ]),
    ...mapGetters([
      'patternList',
      'mappingList',
      'activePlaylist',
      'playlists',
    ]),
    snackbar: {
      get() {
        return this.snackbarMessage !== '';
      },
      set(val) {
        if (!val) {
          this.snackbarMessage = '';
        }
      },
    },
    dropZone: {
      get() {
        return [];
      },
      set(val) {
        let index = this.activePlaylist.length;
        for (const pattern of val) {
          this.createPlaylistItem({index, patternId: pattern.id});
          this.$nextTick(() => this.scrollPlaylist(250));
        }
      },
    },
    playlistName: {
      get() {
        return this.realtime.playlistName;
      },
      set(newval, oldval) {
        const oldObj = {playlistName: oldval};
        const newObj = {playlistName: newval};
        const ops = jsondiff(oldObj, newObj, diffMatchPatch);
        for (const op of ops) {
          realtime.submitOp(op);
        }
      },
    },
    isPlaying() {
      if (!this.realtime.timeInfo) {
        return false;
      } else {
        return this.realtime.timeInfo.activeItemId !== null;
      }
    },
    activePlaylistIndex: {
      get() {
        return this.playlists.findIndex(playlist => playlist.id == this.realtime.playlistId);
      },
      set(val) {
        const playlistId = this.playlists[val].id;
        api.playlistSwitch(playlistId);
      },
    },
    renderer() {
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(this.size, this.size);
      return renderer;
    },
    loader() {
      return new THREE.TextureLoader();
    },
    size() {
      return 128;
    },
    previewPattern() {
      return this.previewItem ? this.patternsById[this.previewItem] : null;
    },
    bottomPadding() {
      return 100;
    },
    scrollStyle() {
      return {
        'max-height': `${this.height-(this.bottomPadding-72)}px`,
        '-webkit-overflow-scrolling': 'touch',
      };
    },
    playlistContainerStyle() {
      return {
        'max-height': `${this.height-this.bottomPadding-64}px`,
        '-webkit-overflow-scrolling': 'touch',
      };
    },
    dropZoneStyle() {
      return {
        height: '64px',
        overflow: 'hidden',
      };
    },
    playlistStyle() {
      return {
        'min-height': `${this.height-this.bottomPadding-64}px`,
      };
    },
  },
  data() {
    return {
      width: 0,
      height: 64,
      columnWidth: 0,
      snackbarMessage: '',
    };
  },
  watch: {
  },
  mounted() {
    this.$nextTick(() => this.onResize());
  },
  methods: {
    ...mapMutations([
      'selectPreviewItem',
    ]),
    ...mapActions([
      'removePlaylistItem',
      'createPlaylistItem',
      'newPlaylist',
    ]),
    onMove(e) {
      const {newIndex, oldIndex} = e;
      this.$nextTick(() => {
        realtime.submitOp(realtime.ops.move('playlist', oldIndex, newIndex));
      });
    },
    onAdd(e) {
      const {newIndex, oldIndex} = e;
      const pattern = this.patternList[oldIndex];
      this.createPlaylistItem({index: e.newIndex, patternId: pattern.id});
    },
    onClose(item, index) {
      this.removePlaylistItem({item, index});
    },
    onResize() {
      this.height = this.$refs.container.clientHeight;
      this.width = this.$refs.container.clientWidth;
      this.columnWidth = this.$refs.column.clientWidth;
    },

    async newPlaylistIfPossible() {
      if (this.isPlaying) {
        this.snackbarMessage = "Cannot create new playlists while playing";
      } else {
        await this.newPlaylist();
      }
    },

    async startPattern(pattern) {
      const mapping = this.mappingList.find(
        mapping => mapping.type == pattern.mapping_type
      );
      await api.startPattern(pattern.id, mapping.id);
    },
    scrollPlaylist(duration) {
      let start = null;
      const el = this.$refs.playlistContainer;
      const initial = el.scrollTop;
      const target = el.scrollHeight + this.size;
      const frame = ts => {
        if (!start) start = ts;
        const val = ease(ts-start, initial, target, duration);
        el.scrollTop = val;
        if (val < target) {
          window.requestAnimationFrame(frame);
        }
      }
      window.requestAnimationFrame(frame);
    },
  },
};
</script>
