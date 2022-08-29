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
        <v-list-item v-if="platform === 'darwin'" @click="confirmPowerOff">
          <v-list-item-icon>
            <v-icon>mdi-power</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Power off</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
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
    <v-card-title>Confirm Power Off</v-card-title>
    <v-card-text v-if="shutdownState==='failed'" class="red--text">There seems to have been a problem shutting down</v-card-text>
    <v-card-text tag="p">This will power off the computer and the lights will go dark. It will take several minutes to turn the lights back on.</v-card-text>
    <v-card-text tag="p">Are you sure you want to do this?</v-card-text>
    <v-card-actions>
    <v-spacer />
    <v-btn @click="cancel" :disabled="shutdownState === 'pending'" color="blue-grey">Cancel</v-btn>
    <v-btn @click="submit" :loading="shutdownState === 'pending'" :disabled="!realtimeLoaded" color="red">Power off</v-btn>
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
      shutdownState: null,
    };
  },
  computed: {
    ...mapState(['realtimeLoaded', 'realtime', 'patternsById', 'canAccessSettings', 'platform']),
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
    realtimeLoaded() {
      if (this.shutdownState == 'pending' && !this.realtimeLoaded) {
        this.shutdownState = null;
        this.dialog = false;
      }
    },
    shutdownState() {
      if (this.shutdownState == 'pending') {
        this.shutdownInterval = window.setTimeout(() => this.shutdownState = 'failed', 60*1000);
      } else {
        if (this.shutdownInterval) {
          window.clearInterval(this.shutdownInterval);
        }
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
    confirmPowerOff() {
      this.dialog = true;
    },
    toggleShuffle() {
      realtime.submitOp({p: ['shuffleMode'], oi: !this.realtime.shuffleMode});
    },
    toggleHold() {
      realtime.submitOp({p: ['hold'], oi: !this.realtime.hold});
    },
    async submit() {
      this.shutdownState = 'pending';
      await this.shutdown();
    },
    cancel() {
      this.pendingShutdown = null;
      this.dialog = false;
    },
  },

  mounted() {
    this.$nextTick(() => {
      store.dispatch('fetchSavefileState');
    });
  },
};
</script>
