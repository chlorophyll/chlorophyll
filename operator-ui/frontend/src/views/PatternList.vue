<template>
  <v-list>
    <template v-for="(pattern, index) in patternList">
      <v-list-item v-ripple @click="startPattern(pattern.id)" :key="`pattern${pattern.id}`">
        <v-list-item-content>
          {{ pattern.name }}
        </v-list-item-content>
      </v-list-item>
      <v-divider
        v-if="index + 1 < patternList.length"
        :key="index"
      ></v-divider>
    </template>
  </v-list>
</template>

<script>
import {mapState, mapGetters} from 'vuex';
import store from '@/store';
import api from '@/api';
export default {
  store,
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
    ])
  },
  methods: {
    async startPattern(patternId) {
      const pattern = this.patternsById[patternId];
      const mapping = this.mappingList.find(
        mapping => mapping.type == pattern.mapping_type
      );
      await api.startPattern(patternId, mapping.id);
    },
  }
};
</script>
