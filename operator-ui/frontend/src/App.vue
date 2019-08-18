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
        <v-list-item link to="/settings">
          <v-list-item-icon>
            <v-icon>mdi-tune</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="headline">
        <span>Chlorophyll</span>
      </v-toolbar-title>
      <template v-if="!realtimeLoaded">
        <v-divider vertical inset class="mx-2" />
        <div class="d-flex ma-4 body-2 grey--text align-center" v-if="!realtimeLoaded">
          <v-progress-circular indeterminate color="grey" class="mr-1" size="20" />
          <div>Connecting to server...</div>
        </div>
      </template>
      <v-spacer></v-spacer>
      <v-btn icon @click="playlistPrev"><v-icon>mdi-skip-previous</v-icon></v-btn>
      <v-btn icon @click="togglePlaylist"><v-icon>{{ playlistIcon }}</v-icon></v-btn>
      <v-btn icon @click="playlistNext"><v-icon>mdi-skip-next</v-icon></v-btn>
      <v-divider vertical inset class="mx-2" />
      <v-btn icon :color="shuffleButtonColor" @click="toggleShuffle"><v-icon>mdi-shuffle-variant</v-icon></v-btn>
    </v-app-bar>
    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
import store from '@/store';
import {ApiMixin} from '@/api';
import * as realtime from '@/realtime';
realtime.init(store);

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
    realtimeLoaded() {
      return this.$store.state.realtimeLoaded;
    },
    realtime() {
      return this.$store.state.realtime;
    },
    isPlaying() {
      if (!this.realtime.timeInfo) {
        return false;
      } else {
        return this.realtime.timeInfo.activeItemId !== null;
      }
    },
    playlistIcon() {
      return this.isPlaying ? 'mdi-stop' : 'mdi-play';
    },
    shuffleButtonColor() {
      return this.realtime.shuffleMode ? 'primary' : '';
    },
  },
  methods: {
    togglePlaylist() {
      if (this.isPlaying) {
        this.playlistStop();
      } else {
        this.playlistStart();
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      store.dispatch('fetchSavefileState');
    });
  },
};
</script>
