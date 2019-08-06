<template>
  <v-app>
    <v-navigation-drawer app temporary v-model="drawer">
      <v-list-item>
        <v-list-item-content>
          <v-list-item-title class="title">
            Chlorophyll
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list
        dense
        nav
      >
        <v-list-item link to="/">
          <v-list-item-icon>
            <v-icon>mdi-view-list</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Patterns</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="headline">
        <span>Chlorophyll</span>
      </v-toolbar-title>
        <v-spacer></v-spacer>
        <span>{{ realtime.globalBrightness }}</span>
        <v-btn icon @click="updateGlobalBrightness(50)"><v-icon>mdi-minus</v-icon></v-btn>
        <v-spacer></v-spacer>
        <v-btn icon @click="stopPattern"><v-icon>mdi-stop</v-icon></v-btn>
    </v-app-bar>
    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
import {mapState} from 'vuex';
import store from '@/store';
import * as realtime from '@/realtime';
import {ApiMixin} from '@/api';

export default {
  name: 'App',
  store,
  mixins: [ApiMixin],
  data() {
    return {
      drawer: false,
    };
  },
  computed: {
    ...mapState([
      'realtime',
    ]),
  },
  methods: {
    updateGlobalBrightness(val) {
      const delta = val - this.realtime.globalBrightness;
      realtime.submitOp({p:['globalBrightness'], na: delta});
    },
  },
  mounted() {
    this.$nextTick(() => {
      realtime.init(store);
      store.dispatch('fetchSavefileState');
    });
  },
};
</script>
