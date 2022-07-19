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
  <v-divider class="ma-2" />
  <v-row>
    <v-spacer />
    <v-btn class="px-8" x-large @click="bigDecrement"><v-icon>mdi-minus</v-icon>10</v-btn>
    <v-spacer />
    <v-btn class="px-8" x-large @click="bigIncrement"><v-icon>mdi-plus</v-icon>10</v-btn>
    <v-spacer />
  </v-row>
  <v-divider class="ma-8" />
  <v-row v-if="mode === 'count'">
    <v-slider v-model='countGuess' min='0' max='510' />
  </v-row>
  <v-row v-if="mode === 'column'">
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
    <v-spacer/><v-btn class="px-8" x-large @click="swapMode">Swap to {{ nextMode }} mode</v-btn>
  </v-row>
</v-container>
</template>

<script>
import {mapState, mapActions} from 'vuex';
import keyboard from 'keyboardjs';
import store from './store';


const modelist = ['column', 'count', 'offsets'];
const nextmode = {};
for (let i = 0; i < modelist.length; i++) {
  nextmode[modelist[i]] = modelist[(i+1)%modelist.length];
}
console.log(nextmode);

export default {
  name: 'Mapper',
  store,
  mounted() {
    keyboard.bind('p', () => this.increment());
    keyboard.bind('m', () => this.decrement());
    keyboard.bind('shift + p', () => this.bigIncrement());
    keyboard.bind('shift + m', () => this.bigDecrement());
    keyboard.bind('space', () => this.next());
    keyboard.bind('shift + space', () => this.prev());
  },
  computed: {
    ...mapState(['guess', 'col', 'panel', 'mode']),
    noun() {
      switch (this.mode) {
        case 'count':
          return 'strip';
          case 'column':
          return 'column';
          case 'offsets':
          return 'offset';
      }
    },
    countGuess: {
      get() {
        return this.guess;
      },
      set(val) {
        this.setGuess(val);
      },
    },
    nextMode() {
      return nextmode[this.mode];
    },
  },
  methods: {
    ...mapActions(['increment', 'decrement', 'prev', 'next', 'setGuess', 'setMode']),

    bigIncrement() {
        this.countGuess += 10;
    },

    bigDecrement() {
        this.countGuess -= 10;
    },

    async swapMode() {
      await this.setMode(this.nextMode);
    }
  },
}
</script>
