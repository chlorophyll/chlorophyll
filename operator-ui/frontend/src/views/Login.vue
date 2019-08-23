<template>
  <v-card
    class="mx-auto mt-8"
    max-width="400"
  >
  <v-card-title>Configuration Management</v-card-title>
  <v-card-text>
  This panel isn't particularly interesting. It lets you turn off the lights, delete playlists, and access some stats.
  <v-form>
  <v-text-field
    ref="password"
    @keyup.enter="submit"
    @focus="clearFail"
    v-model="password"
    :error="failed"
    type="password"
    label="Password"
    autocomplete="one-time-code"
  />
  </v-form>
  </v-card-text>
  <v-card-actions>
  <v-spacer/>
  <v-btn @click="cancel">Cancel</v-btn>
  <v-btn @click="submit" color="primary">Continue</v-btn>
  </v-card-actions>
  </v-card>
</template>

<script>
import {mapActions} from 'vuex';
import store from '@/store';
export default {
  name: 'Login',
  data() {
    return {
      password: '',
      failed: false,
    };
  },
  mounted() {
    this.$nextTick(() => this.$refs.password.focus());
  },
  methods: {
    ...mapActions([
      'authenticate',
    ]),
    cancel() {
      this.$router.go(-1);
    },
    clearFail() {
      this.failed = false;
    },
    async submit() {
      this.failed = false;
      const result = await this.authenticate({password: this.password});
      if (result) {
        this.$router.push(this.$route.query.redirectFrom);
      } else {
        this.failed = true;
      }
    },
  },
};
</script>
