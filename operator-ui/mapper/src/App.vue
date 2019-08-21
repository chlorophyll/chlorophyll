<template>
  <v-app>
    <v-app-bar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Mapper</span>
      </v-toolbar-title>
    </v-app-bar>
    <v-content>
      <template v-if="!allPanels">
        <v-progress-circular indeterminate size="250" />
      </template>
      <template v-else>
        <template v-if="!panel">
          <v-list dense>
            <v-subheader>Select a panel</v-subheader>
            <v-list-item :key="p" v-for="p in allPanels" @click="selectPanel(p)">
              <v-list-item-content>{{ p }}</v-list-item-content>
            </v-list-item>
          </v-list>
        </template>
        <template v-else>
          <Mapper />
        </template>
      </template>
    </v-content>
  </v-app>
</template>

<script>
import {mapState, mapActions} from 'vuex';
import store from './store';
import Mapper from './Mapper';

export default {
  name: 'App',
  store,
  components: { Mapper },
  computed: {
    ...mapState(['allPanels', 'panel']),
  },
  methods: {
    ...mapActions(['selectPanel', 'init']),
  },
  async mounted() {
    await this.init();
  },
};
</script>
