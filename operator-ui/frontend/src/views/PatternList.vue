<template>
  <v-container
    fluid
    grid-list-md
    pa-2
  >
    <v-layout wrap>
      <v-flex xs12 md6>
        <v-container
          fluid
          grid-list-md
          pa-2
        >
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
        <v-container
          fluid
          grid-list-md
          pa-2
        >
          <preview-card
            v-if="previewPattern"
            :pattern="previewPattern"
            :size="size*2"
            :renderer="renderer"
            :loader="loader"
          />
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
  },
  methods: {
    ...mapMutations([
      'selectPreviewItem',
    ]),
    async startPattern(pattern) {
      const mapping = this.mappingList.find(
        mapping => mapping.type == pattern.mapping_type
      );
      await api.startPattern(pattern.id, mapping.id);
    },
  },
};
</script>
