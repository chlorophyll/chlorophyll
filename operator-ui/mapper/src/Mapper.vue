<template>
<v-container fluid>
  <v-row>
    <v-card flat color="transparent">
      <v-card-title>Mapping: {{ panel }}</v-card-title>
      <v-card-text>Current Guess: {{ guess }}</v-card-text>
      <v-card-text>Current {{ noun }}: {{ col }}</v-card-text>
    </v-card>
  </v-row>
  <v-divider class="ma-2" />

  <v-row>
    <v-spacer />
    <v-btn class="px-8" x-large @click="decrement"><v-icon>mdi-minus</v-icon></v-btn>
    <v-spacer />
    <v-btn class="px-8" x-large @click="increment"><v-icon>mdi-plus</v-icon></v-btn>
    <v-spacer />
  </v-row>
  <v-row v-if="mode === 'count'">
    <v-spacer />
    <v-slider v-model='countGuess' min='0' max='510' />
  </v-row>
  <v-row v-if="mode !== 'count'">
    <v-spacer />
    <v-slider v-model='countGuess' min='0' max='150' />
  </v-row>
  <v-divider class="ma-12" />
  <v-row>
    <v-spacer />
    <v-btn class="px-8" x-large @click="prev"><v-icon>mdi-arrow-left</v-icon></v-btn>
    <v-spacer />
    <v-btn class="px-8" x-large color="primary" @click="next"><v-icon>mdi-arrow-right</v-icon></v-btn>
    <v-spacer />
  </v-row>
  <v-divider class="ma-12" />
  <v-row>
    <v-spacer/><v-btn class="px-8" x-large @click="swapMode">Swap to {{ otherMode }} mode</v-btn>
  </v-row>
</v-container>
</template>

<script>
import {mapState, mapActions} from 'vuex';
import store from './store';

export default {
  name: 'Mapper',
  store,
  computed: {
    ...mapState(['guess', 'col', 'panel', 'mode']),
    noun() {
      return this.mode === 'count' ? 'strip' : 'column';
    },
    countGuess: {
      get() {
        return this.guess;
      },
      set(val) {
        this.setGuess(val);
      },
    },
    otherMode() {
      return this.mode === 'count' ? 'column' : 'count';
    },
  },
  methods: {
    ...mapActions(['increment', 'decrement', 'prev', 'next', 'setGuess', 'setMode']),
    async swapMode() {
      await this.setMode(this.otherMode);
    }
  },
}
</script>
