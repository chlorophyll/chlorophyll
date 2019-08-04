<template>
  <v-container
    fluid
    grid-list-md
    pa-2
  >
    <v-layout wrap>
      <template v-for="(pattern, index) in patternList">
        <v-flex :class="flexClass" :key="`pattern${pattern.id}`">
          <v-card v-ripple @click="startPattern(pattern)">
            <template v-if="$vuetify.breakpoint.mdAndUp">
              <v-card-title class="black pa-0 fill-height">
                <static-preview :width="size" :height="size" :pattern="pattern" :renderer="renderer" />
              </v-card-title>
            <v-card-text class="text-center text-truncate mt-2">
              {{ pattern.name }}
            </v-card-text>
          </template>
          <template v-else>
            <v-list-item class="pr-0">
              <v-list-item-content>{{ pattern.name }}</v-list-item-content>
              <v-list-item-avatar :size="size" tile class="pa-0 ma-0" style="border-radius: inherit">
                <static-preview :width="size" :height="size" :pattern="pattern" :renderer="renderer" />
              </v-list-item-avatar>
            </v-list-item>
          </template>
        </v-card>
        </v-flex>
      </template>
    </v-layout>
  </v-container>
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
    flexClass() {
      if (this.$vuetify.breakpoint.mdAndUp) {
        return 'xs3';
      } else {
        return 'xs12';
      }
    },
    renderer() {
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(this.size, this.size);
      return renderer;
    },
    size() {
      return this.$vuetify.breakpoint.mdAndUp ? 128 : 96;
    },
  },
  methods: {
    async startPattern(pattern) {
      const mapping = this.mappingList.find(
        mapping => mapping.type == pattern.mapping_type
      );
      await api.startPattern(pattern.id, mapping.id);
    },
  },
};
</script>
