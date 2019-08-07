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
      <v-layout v-bind="layout">
      <v-flex xs6>
        <v-card flat color="transparent">
          <v-subheader>Color A</v-subheader>
          <ColorPicker :width="200" :height="200" v-model="color1" />
        </v-card>
      </v-flex>
      <v-flex xs6>
        <v-card flat color="transparent">
          <v-subheader>Color B</v-subheader>
          <ColorPicker :width="200" :height="200" v-model="color2" />
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

export default {
  store,
  name: 'Settings',
  components: {ColorPicker},
  mixins: [
    realtime.mixin('globalBrightness', realtime.ops.number),
    realtime.mixin('intensity', realtime.ops.number),
    realtime.mixin('fader1', realtime.ops.number),
    realtime.mixin('fader2', realtime.ops.number),
    realtime.mixin('color1', realtime.ops.replace),
    realtime.mixin('color2', realtime.ops.replace),
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
