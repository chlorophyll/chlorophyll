<template>
  <v-container fluid grid-list-xs>
    <v-layout wrap>
      <v-flex xs12>
        <v-card flat color="transparent">
          <v-subheader>Brightness</v-subheader>
          <v-card-text>
            <v-slider
              v-model="globalBrightness"
              append-icon="mdi-brightness-4"
              prepend-icon="mdi-brightness-5"
            />
          </v-card-text>
        </v-card>
      <v-divider />
      </v-flex>
      <v-flex xs12>
        <v-subheader>BPM</v-subheader>
        <v-card-text>
          <v-layout>
            <v-flex class="pr-4">
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
      <v-flex xs12>
        <v-card flat color="transparent">
          <v-subheader>Intensity</v-subheader>
          <v-card-text>
            <v-slider
              v-model="intensity"
              prepend-icon="mdi-gauge-empty"
              append-icon="mdi-gauge-full"
            />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex xs12>
        <v-card flat color="transparent">
          <v-subheader>Fader 1</v-subheader>
          <v-card-text>
            <v-slider
              v-model="fader1"
              prepend-icon="mdi-puzzle-outline"
              append-icon="mdi-puzzle"
            />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex xs12>
        <v-card flat color="transparent">
          <v-subheader>Fader 2</v-subheader>
          <v-card-text>
            <v-slider
              v-model="fader2"
              prepend-icon="mdi-flask-empty-outline"
              append-icon="mdi-flask-empty"
            />
          </v-card-text>
        </v-card>
      </v-flex>
      <v-divider />
      <v-layout v-bind="layout">
      <v-flex xs6>
        <v-card flat color="transparent">
          <v-subheader>Color A</v-subheader>
          <ColorPicker :width="150" :height="150" v-model="color1" />
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card flat color="transparent">
          <v-subheader>Color B</v-subheader>
          <ColorPicker :width="150" :height="150" v-model="color2" />
        </v-card>
      </v-flex>
      </v-layout>
    </v-layout>
  </v-container>
</template>

<script>
import {mapState} from 'vuex';
import store from '@/store';
import * as realtime from '@/realtime';
import ColorPicker from 'vue-color-picker-wheel';
import TempoTap from '@/components/tempo_tap';

export default {
  store,
  name: 'Settings',
  components: {ColorPicker, TempoTap},
  mixins: [
    realtime.mixin('globalBrightness', realtime.ops.number),
    realtime.mixin('intensity', realtime.ops.number),
    realtime.mixin('fader1', realtime.ops.number),
    realtime.mixin('fader2', realtime.ops.number),
    realtime.mixin('color1', realtime.ops.replace),
    realtime.mixin('color2', realtime.ops.replace),
    realtime.mixin('bpm', realtime.ops.number),
  ],
  computed: {
    layout() {
      const binding = {};

      if (this.$vuetify.breakpoint.mdAndUp) {
        binding.column = true;
      }

      return binding;
    },
  },
}
</script>
