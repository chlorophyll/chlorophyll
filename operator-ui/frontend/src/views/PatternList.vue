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
            :width="columnWidth - 32"
            :pattern="previewPattern"
            :size="size*1.25"
            :renderer="renderer"
            :loader="loader"
          />
    <v-layout>
      <v-flex xs12 md6 ref="column">
        <v-container :style="scrollStyle" class="overflow-y-auto">
          <v-layout wrap>
            <template v-for="(pattern, index) in patternList">
              <v-flex xs12 :key="`pattern${pattern.id}`">
              <pattern-card
                :pattern="pattern"
                :size="size"
                :renderer="renderer"
                :loader="loader"
                @click="selectPreviewItem(pattern)"
                />
              </v-flex>
            </template>
          </v-layout>
        </v-container>
      </v-flex>
      <v-flex hidden-sm-and-down md6>
        <v-container :style="scrollStyle" class="overflow-y-auto">
        </v-container>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import {mapState, mapGetters, mapMutations} from 'vuex';
import * as THREE from 'three';
import store from '@/store';
import api from '@/api';
import PreviewCard from '@/components/PreviewCard';
import PatternCard from '@/components/PatternCard';
export default {
  store,
  components: { PatternCard, PreviewCard },
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
  mounted() {
    this.$nextTick(() => this.onResize());
  },
  methods: {
    ...mapMutations([
      'selectPreviewItem',
    ]),
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
