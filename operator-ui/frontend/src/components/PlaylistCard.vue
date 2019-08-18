<template>
  <v-card class="d-flex align-center">
    <preview-model
      :width="size"
      :height="size"
      :pattern="pattern"
      :renderer="renderer"
      :loader="loader"
    />
    <v-layout column>
      <v-flex>
        <v-layout class="align-center pr-4">
          <v-flex xs8>
            <v-layout column fill-height class="text-truncate">
              <div class="ml-3 title">{{ pattern.name}}</div>
              <v-card-actions>
                <v-btn @click="playNow">Play now</v-btn>
                <v-btn @click="$emit('close')">Remove</v-btn>
              </v-card-actions>
            </v-layout>
          </v-flex>
          <v-spacer />
          <v-flex>
            <v-card>
            <masked-input
              type="text"
              class="pa-1"
              style="width: 5em"
              @focus="focusDuration"
              @blur="blurDuration"
              :mask="[/\d/, /\d/, ':', /\d/, /\d/, ]"
              :keep-char-positions="true"
              placeholder="mm:ss"
              v-model="durationString" />
            </v-card>
          </v-flex>
          <v-spacer/>
          <v-flex shrink>
            <v-icon class="handle" x-large>mdi-drag</v-icon>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex class="px-1">
        <v-progress-linear :stream="isOnlyPlayingItem" :buffer-value="0" :background-opacity="opacity" rounded :value="progress*100" />
      </v-flex>
    </v-layout>

  </v-card>
</template>

<script>
import {mapActions, mapState, mapGetters} from 'vuex';
import * as numeral from 'numeral';
import PreviewModel from '@/components/PreviewModel';
import MaskedInput from 'vue-text-mask';
import store from '@/store';
import {ApiMixin} from '@/api';

export default {
  store,
  props: ['size', 'index', 'playlistItem', 'renderer', 'loader', 'draggable'],
  components: {PreviewModel, MaskedInput},
  mixins: [ApiMixin],
  name: 'playlist-card',
  data() {
    return {
      durationForEditing: null,
    };
  },
  computed: {
    ...mapState([
      'realtime',
    ]),
    ...mapGetters([
      'activePlaylist',
    ]),
    timeInfo() {
      return this.realtime.timeInfo;
    },
    showProgress() {
      const numItems = this.activePlaylist.length;
      if (numItems <= 1 || this.realtime.hold) {
        return false;
      }

      return (
        this.timeInfo.activeItemId === this.playlistItem.id ||
        this.timeInfo.targetItemId === this.playlistItem.id
      );
    },
    time() {
      const numItems = this.activePlaylist.length;
      if (numItems <= 1 || this.realtime.hold) {
        return 0;
      }

      if (this.playlistItem.id === this.timeInfo.activeItemId) {
        return this.timeInfo.activeTime;
      } else if (this.playlistItem.id === this.timeInfo.targetItemId) {
        return this.timeInfo.targetTime;
      } else {
        return 0;
      }
    },
    opacity() {
      if (this.playlistItem.id === this.timeInfo.activeItemId) {
        return 0.3;
      } else {
        return 0;
      }
    },
    isOnlyPlayingItem() {
      return (
        (this.activePlaylist.length === 1 || this.realtime.hold) &&
        this.playlistItem.id === this.timeInfo.activeItemId
      );
    },

    progress() {
      return this.time / this.duration;
    },
    minutes() {
      return Math.floor(this.duration / 60);
    },
    seconds() {
      return this.duration % 60;
    },
    duration: {
      get() {
        return this.playlistItem.duration;
      },
      set(val) {
        this.updateDuration({index: this.index, newval: val, oldval: this.duration});
      },
    },
    pattern() {
      return this.playlistItem.pattern;
    },

    durationString: {
      get() {
        if (this.durationForEditing !== null) {
          return this.durationForEditing;
        }
        const minutes = numeral(this.minutes).format('00');
        const seconds = numeral(this.seconds).format('00');
        const ret = `${minutes}:${seconds}`;
        return ret;
      },
      set(val) {
        if (this.durationForEditing !== null) {
          this.durationForEditing = val;
        }
      },
    },
  },
  methods: {
    ...mapActions([
      'updateDuration',
    ]),
    async playNow() {
      await this.playlistStart(this.index);
    },
    focusDuration() {
      this.durationForEditing = this.durationString;
    },
    blurDuration() {
      this.duration = numeral(this.durationForEditing).value();
    },
  },
};
</script>
