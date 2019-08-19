<template>
  <v-container>
    <v-layout justify-center>
      <v-flex xs6>
      <v-card>
        <v-list>
          <v-subheader class="title">Lighting</v-subheader>
          <v-list-item>
            <v-list-item-icon><v-icon>mdi-brightness-4</v-icon></v-list-item-icon>
            <v-list-item-content>
              <v-slider
                label="brightness"
              />
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-icon>
              <v-icon>mdi-lightbulb-off</v-icon>
            </v-list-item-icon>
            <v-list-item-content><v-btn>Fade to black</v-btn></v-list-item-content>
          </v-list-item>
          <template v-if="availablePlaylists.length > 0">
          <v-divider />
          <v-subheader class="title"> Delete Playlists</v-subheader>
          <v-list-item
            v-for="playlist in availablePlaylists"
            @click.stop="confirmDelete(playlist)"
            :key="playlist.id"
          >
            <v-list-item-icon><v-icon>mdi-delete-forever</v-icon></v-list-item-icon>
            <v-list-item-content>{{ playlist.name }}</span></v-list-item-content>
          </v-list-item>
          </template>
        </v-list>
      </v-card>
      </v-flex>
    </v-layout>
    <v-dialog v-model="dialog" max-width="400">
      <v-card v-if="dialog">
      <v-card-title>Confirm deletion</v-card-title>
      <v-card-text>This action is not reversible. Delete {{ selectedPlaylist.name }}?</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="cancel">Cancel</v-btn>
        <v-btn @click="deleteSelectedPlaylist" color="red"><v-icon>mdi-delete-forever</v-icon>Delete</v-btn>
      </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import {mapGetters, mapState, mapActions} from 'vuex';
import store from '@/store';
export default {
  store,
  name: 'Settings',
  beforeRouteEnter(to, from, next) {
    if (store.state.canAccessSettings) {
      next();
    } else {
      next({
        name: 'login',
        query: {redirectFrom: to.fullPath},
      });
    }
  },
  data() {
    return {
      selectedPlaylistId: null,
    };
  },
  computed: {
    ...mapGetters(['playlists']),
    ...mapState(['playlistsById', 'realtime']),
    activePlaylistId() {
      return this.realtime.playlistId;
    },
    isPlaying() {
      return this.realtime.timeInfo.activeItemId !== null;
    },
    availablePlaylists() {
      if (this.isPlaying) {
        return this.playlists.filter(playlistId => playlistId !== this.activePlaylistId);
      } else {
        return this.playlists;
      }
    },

    dialog: {
      get() {
        return this.selectedPlaylistId !== null;
      },
      set(val) {
        if (!val) {
          this.selectedPlaylistId == null;
        }
      },
    },
    selectedPlaylist() {
      return this.selectedPlaylistId ? this.playlistsById[this.selectedPlaylistId] : null;
    },
  },
  methods: {
    ...mapActions(['deletePlaylist']),
    confirmDelete(playlist) {
      this.selectedPlaylistId = playlist.id;
    },
    async deleteSelectedPlaylist() {
      const playlistId = this.selectedPlaylistId;
      this.selectedPlaylistId = null;
      await this.deletePlaylist({playlistId});
    },
    cancel() {
      this.selectedPlaylistId = null;
    },
  },
};
</script>
