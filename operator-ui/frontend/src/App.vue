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
            <v-icon>mdi-playlist-play</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Patterns</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/playlist-editor">
          <v-list-item-icon>
            <v-icon>mdi-playlist-edit</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Playlist Editor</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item link to="/parameters">
          <v-list-item-icon>
            <v-icon>mdi-tune</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Parameters</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    <template v-slot:append>
      <v-list dense nav>
        <v-list-item link to="/settings">
          <v-list-item-icon>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Configuration</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </template>
    </v-navigation-drawer>
    <v-app-bar app>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title class="headline">
        <span>Chlorophyll</span>
      </v-toolbar-title>
      <div class="d-flex ma-4 body-2 grey--text align-center" v-if="isPlaying">
        <div>Now Playing: <span class="font-weight-bold">{{ this.activeItem.pattern.name }}</span></div>
      </div>
      <template v-if="!realtimeLoaded">
        <v-divider vertical inset class="mx-2" />
        <div class="d-flex ma-4 body-2 grey--text align-center" v-if="!realtimeLoaded">
          <v-progress-circular indeterminate color="grey" class="mr-1" size="20" />
          <div>Connecting to server...</div>
        </div>
      </template>
      <v-spacer></v-spacer>
      <v-btn icon @click="playlistPrev"><v-icon>mdi-skip-previous</v-icon></v-btn>
      <v-btn icon @click="play"><v-icon>{{ playIcon }}</v-icon></v-btn>
      <v-btn icon @click="playlistNext"><v-icon>mdi-skip-next</v-icon></v-btn>
      <v-divider vertical inset class="mx-2" />
      <v-btn icon :color="shuffleButtonColor" @click="toggleShuffle"><v-icon>mdi-shuffle-variant</v-icon></v-btn>
      <v-btn icon :color="holdButtonColor" @click="toggleHold"><v-icon>mdi-repeat</v-icon></v-btn>
    </v-app-bar>
    <v-dialog v-model="dialog" max-width="400">
    <v-card class="mx-auto">
    <v-card-title>Confirm</v-card-title>
    <v-card-text>To stop the playlist, enter the password
    <v-form>
      <v-text-field
        id="password"
        @keyup.enter="submit"
        @focus="clearFail"
        v-model="password"
        :error="failed"
        type="password"
        label="Password"
        autocomplete="one-time-code"
      />
    </v-form>
    </v-card-text>
    <v-card-actions>
    <v-spacer />
    <v-btn @click="cancel">Cancel</v-btn>
    <v-btn @click="submit" color="primary">Stop Playlist</v-btn>
    </v-card-actions>
    </v-card>
    </v-dialog>
    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
import {mapState, mapGetters, mapActions} from 'vuex';
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
      dialog: false,
      password: '',
      failed: false,
    };
  },
  computed: {
    ...mapState(['realtimeLoaded', 'realtime', 'patternsById', 'canAccessSettings']),
    ...mapGetters(['activePlaylist']),
    activeItemId() {
      if (!this.realtime.timeInfo) {
        return null;
      } else {
        return this.realtime.timeInfo.activeItemId;
      }
    },
    isPlaying() {
      return this.activeItemId !== null;
    },
    playlistIcon() {
      return this.isPlaying ? 'mdi-stop' : 'mdi-play';
    },
    shuffleButtonColor() {
      return this.realtime.shuffleMode ? 'primary' : '';
    },
    holdButtonColor() {
      return this.realtime.hold ? 'primary' : '';
    },
    activeItem() {
      const activeItem = this.activePlaylist.find(item => item.id == this.activeItemId);
      return activeItem;
    },
    playIcon() {
      if (this.isPlaying) {
        return 'mdi-stop';
      } else {
        return 'mdi-play';
      }
    },
  },
  watch: {
    canAccessSettings() {
      this.dialog = false;
    },
    dialog() {
      if (this.dialog) {
        this.$nextTick(() => {
          const el = document.getElementById('password');
          el.focus();
        });
      }
    },
  },
  methods: {
    ...mapActions([
      'authenticate',
    ]),
    play() {
      if (!this.isPlaying) {
        this.playlistStart();
      } else {
        this.playlistStop();
      }
    },
    toggleShuffle() {
      realtime.submitOp({p: ['shuffleMode'], oi: !this.realtime.shuffleMode});
    },
    toggleHold() {
      realtime.submitOp({p: ['hold'], oi: !this.realtime.hold});
    },
    async submit() {
      this.failed = false;
      const result = await this.authenticate({password: this.password});
      if (result) {
        this.playlistStop();
      } else {
        this.failed = true;
      }
    },
    cancel() {
      this.failed = false;
      this.dialog = false;
    },
    clearFail() {
      this.failed = false;
    },
  },

  mounted() {
    this.$nextTick(() => {
      store.dispatch('fetchSavefileState');
    });
  },
};
</script>
