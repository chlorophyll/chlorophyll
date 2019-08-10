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
        <v-layout class="align-center">
          <v-flex grow>
            <v-card flat color="transparent">
              <v-card-title>{{ pattern.name }}</v-card-title>
                <v-card-actions>
                  <v-btn>Play now</v-btn>
                  <v-btn @click="$emit('close')">Remove</v-btn>
                </v-card-actions>
            </v-card>
          </v-flex>
          <v-flex shrink>
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
            <v-icon class="handle">mdi-drag</v-icon>
          </v-flex>
        </v-layout>
      </v-flex>
      <v-flex class="px-1">
        <v-progress-linear background-opacity="0" rounded value="50" />
      </v-flex>
    </v-layout>

  </v-card>
</template>

<script>
import * as numeral from 'numeral';
import PreviewModel from '@/components/PreviewModel';
import MaskedInput from 'vue-text-mask';

export default {
  props: ['size', 'pattern', 'renderer', 'loader', 'draggable'],
  components: {PreviewModel, MaskedInput},
  name: 'playlist-card',
  data() {
    return {
      durationForEditing: null,
      duration: 60,
    };
  },
  computed: {
    minutes() {
      return Math.floor(this.duration / 60);
    },
    seconds() {
      return this.duration % 60;
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
    focusDuration() {
      this.durationForEditing = this.durationString;
    },
    blurDuration() {
      this.duration = numeral(this.durationForEditing).value();
    },
  },
};
</script>
