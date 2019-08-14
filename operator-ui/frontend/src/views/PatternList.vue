<template>
  <v-container
    fluid
    grid-list-md
    pa-2
    fill-height
    ref="container"
    v-resize="onResize"
  >
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
        <v-container :style="scrollStyle" class="overflow-y-auto">
          <draggable
            :list="playlist"
            :animation="100"
            handle=".handle"
            class="layout wrap"
            @update="onMove"
            @add="onAdd"
            :group="{name: 'patterns', pull: false, put: true}"
          >
            <template v-for="(playlistItem, index) in playlist">
              <v-flex xs12 :key="playlistItem.id">
                <playlist-card
                  :index="index"
                  :playlist-item="playlistItem"
                  :size="size"
                  :renderer="renderer"
                  :loader="loader"
                  :draggable="true"
                  @close="onClose(playlistItem, index)"
                />
              </v-flex>
            </template>
            </draggable>
        </v-container>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import {mapState, mapGetters, mapMutations, mapActions} from 'vuex';
import * as THREE from 'three';
import store from '@/store';
import api from '@/api';
import PreviewCard from '@/components/PreviewCard';
import PatternCard from '@/components/PatternCard';
import PlaylistCard from '@/components/PlaylistCard';
import draggable from 'vuedraggable';
import * as realtime from '@/realtime';
export default {
  store,
  components: { PatternCard, PreviewCard, PlaylistCard, draggable },
  name: 'PatternList',
  computed: {
    ...mapState([
      'patternsById',
      'patternOrder',
      'mappingsById',
      'previewItem',
    ]),
    ...mapGetters([
      'patternList',
      'mappingList',
      'playlist',
    ]),
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
    scrollStyle() {
      return {
        'max-height': `${this.height-32}px`,
        '-webkit-overflow-scrolling': 'touch',
      };
    },
  },
  data() {
    return {
      width: 0,
      height: 64,
      columnWidth: 0,
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

    async startPattern(pattern) {
      const mapping = this.mappingList.find(
        mapping => mapping.type == pattern.mapping_type
      );
      await api.startPattern(pattern.id, mapping.id);
    },
  },
};
</script>
