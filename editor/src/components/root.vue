<template>
    <component v-bind:is="current_state" />
</template>

<script>
import { mapState } from 'vuex';
import App from '@/components/app';
import Landing from '@/components/landing';
import store from 'chl/vue/store';

export default {
    store,
    name: 'root',
    components: { App, Landing },
    computed: {
        ...mapState([
            'has_current_model',
        ]),
        current_state() {
            return this.has_current_model ? 'app' : 'landing';
        }
    }
};
</script>
