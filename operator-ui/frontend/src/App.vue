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
      <v-menu offset-y>
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on"><v-icon>mdi-dots-vertical</v-icon></v-btn>
        </template>
        <v-list dense>
          <v-list-item>
            <v-list-item-icon><v-icon>mdi-pencil</v-icon></v-list-item-icon>
            <v-list-item-content>Rename Playlist</v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-icon><v-icon color="red" class="text-darken-4">mdi-delete</v-icon></v-list-item-icon>
            <v-list-item-content class="red--text text-darken-4">Delete Playlist</v-list-item-content>
          </v-list-item>
          <v-divider v-if="playlists.length > 0" />
          <template v-for="playlist in playlists">
          </template>
        </v-list>
      </v-menu>
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
      playlists: [],
    };
  },
  computed: {
    realtimeLoaded() {
      return this.$store.state.realtimeLoaded;
    },
    isPlaying() {
      if (!this.$store.state.realtime.timeInfo) {
        return false;
      } else {
        return this.$store.state.realtime.timeInfo.activeItemId !== null;
      }
    },
    playlistIcon() {
      return this.isPlaying ? 'mdi-stop' : 'mdi-play';
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
