<template>
  <v-container fluid grid-list-xs>
    <v-layout wrap>
      <v-flex xs12>
        <v-container>
        <v-card-text>
          <v-layout>
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
             <v-btn v-on="on">
              {{ activePlaylistName }}
              <v-icon>mdi-menu-down</v-icon></v-btn>
          </template>
          <v-list dense>
            <v-list-item-group v-model="activePlaylistIndex">
              <v-list-item v-for="playlist in playlists" :key="playlist.id">
              <v-list-item-content>{{ playlist.name }}</v-list-item-content>
            </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-menu>
          </v-layout>
        </v-card-text>
        </v-container>
      </v-flex>
      <v-flex xs12>
        <v-card-text>
          <v-layout class="mx-12 px-12">
            <v-flex class="px-12 pr-4">
            <v-slider
              v-model="bpm"
              class="align-center"
              :min="10"
              :max="256">
              <template v-slot:prepend>
                <tempo-tap v-model="bpm" />
              </template>
              <template v-slot:append>
                <v-text-field
                  v-model="bpm"
                  type="number"
                  :min="10"
                  :max="256"
                  class="mt-0 pt-0"
                  style="width: 4em"
                  hide-details
                  single-line
                  solo
                />
              </template>
            </v-slider>
            </v-flex>
          </v-layout>
        </v-card-text>
      </v-flex>
      <v-flex><v-divider /></v-flex>
      <v-flex xs12>
        <v-container>
            <template v-for="(playlistItem, index) in activePlaylist">
              <v-flex xs12 :key="`pattern${playlistItem.pattern.id}`">
              <playlist-card
                :index="index"
                :playlist-item="playlistItem"
                :size="size"
                :renderer="renderer"
                :loader="loader"
                :editable="false"
                />
              </v-flex>
            </template>
            </v-subheader>
        </v-container>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
import {mapState, mapGetters, mapMutations, mapActions} from 'vuex';
import store from '@/store';
import * as realtime from '@/realtime';
import api from '@/api';
import * as THREE from 'three';
import PlaylistCard from '@/components/PlaylistCard';
import TempoTap from '@/components/tempo_tap';

export default {
  name: 'Picker',
  store,
  components: { PlaylistCard, TempoTap },
  mixins: [
    realtime.mixin('bpm', realtime.ops.number),
  ],
  computed: {
    ...mapState([
      'patternsById',
      'patternOrder',
      'mappingsById',
      'previewItem',
      'realtime',
    ]),
    ...mapGetters([
      'patternList',
      'mappingList',
      'activePlaylist',
      'playlists',
    ]),
    activePlaylistName() {
      return this.realtime.playlistName;
    },
    activePlaylistIndex: {
      get() {
        return this.playlists.findIndex(playlist => playlist.id == this.realtime.playlistId);
      },
      set(val) {
        const playlistId = this.playlists[val].id;
        api.playlistSwitch(playlistId);
      },
    },
    renderer() {
      const renderer = new THREE.WebGLRenderer();
      renderer.setSize(this.size, this.size);
      return renderer;
    },
    loader() {
      return new THREE.TextureLoader();
    },
    size() {
      return 128;
    },
  },
}
</script>
