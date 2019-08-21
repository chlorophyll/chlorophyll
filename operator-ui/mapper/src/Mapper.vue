<template>
<v-container fluid>
  <v-row>
    <v-card flat color="transparent">
      <v-card-title>Mapping: {{ panel }}</v-card-title>
      <v-card-text>Current Guess: {{ guess }}</v-card-text>
      <v-card-text>Current Column: {{ col }}</v-card-text>
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
  <v-divider class="ma-12" />
  <v-row>
    <v-spacer />
    <v-btn class="px-8" x-large @click="prev"><v-icon>mdi-arrow-left</v-icon></v-btn>
    <v-spacer />
    <v-btn class="px-8" x-large color="primary" @click="next"><v-icon>mdi-arrow-right</v-icon></v-btn>
    <v-spacer />
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
    ...mapState(['guess', 'col', 'panel']),
  },
  methods: {
    ...mapActions(['increment', 'decrement', 'prev', 'next']),
  },
}
</script>
