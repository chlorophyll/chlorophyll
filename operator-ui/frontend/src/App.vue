<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline">
        <span>Chlorophyll</span>
      </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="stopPattern"><v-icon>mdi-stop</v-icon></v-btn>
    </v-app-bar>
    <v-content>
      <v-list>
        <template v-for="(pattern, index) in patterns">
          <v-list-item v-ripple @click="startPattern(pattern.id)" :key="`pattern${pattern.id}`">
            <v-list-item-content>
              {{ pattern.name }}
            </v-list-item-content>
          </v-list-item>
          <v-divider
            v-if="index + 1 < patterns.length"
            :key="index"
          ></v-divider>
        </template>
      </v-list>
    </v-content>
  </v-app>
</template>

<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      patternsById: {},
      patternOrder: [],
      mappings: [],
    };
  },
  computed: {
    patterns() {
      return this.patternOrder.map(id => this.patternsById[id]);
    },
  },
  mounted() {
    this.fetchState();
  },
  methods: {
    async fetchState() {
      const resp = await axios.get('/api/state');
      const state = resp.data;
      this.patternsById = state.patterns;
      this.patternOrder = state.patternOrder;
      this.mappings = Object.values(state.mappings);
    },
    async startPattern(patternId) {
      const mappingId = this.mappings[0].id;
      await axios.post('/api/start', {patternId, mappingId});
    },
    async stopPattern() {
      await axios.post('/api/stop');
    }
  },
};
</script>
