<template>
  <v-list>
    <template v-for="(pattern, index) in patternList">
      <v-card :key="`pattern${pattern.id}`">
      <v-list-item v-ripple @click="startPattern(pattern.id)">
        <v-list-item-content>
          {{ pattern.name }}
        </v-list-item-content>
        <v-list-item-avatar
          :size="size"
          tile
        >
        <static-preview :width="size" :height="size" :pattern="pattern" :renderer="renderer" />
        </v-list-item-avatar>
      </v-list-item>
      </v-card>
    </template>
  </v-list>
</template>

<script>
import {mapState, mapGetters} from 'vuex';
import * as THREE from 'three';
import store from '@/store';
import api from '@/api';
import StaticPreview from '@/components/static_preview';
export default {
  store,
  components: { StaticPreview },
  name: 'PatternList',
  computed: {
    ...mapState([
      'patternsById',
      'patternOrder',
      'mappingsById',
    ]),
    ...mapGetters([
      'patternList',
      'mappingList',
    ]),
    renderer() {
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(this.size/2, this.size/2);
      renderer.setPixelRatio(window.devicePixelRatio);
      return renderer;
    },
    size() {
      return 125;
    },
  },
  methods: {
    async startPattern(patternId) {
      const pattern = this.patternsById[patternId];
      const mapping = this.mappingList.find(
        mapping => mapping.type == pattern.mapping_type
      );
      await api.startPattern(patternId, mapping.id);
    },
  },
};
</script>
