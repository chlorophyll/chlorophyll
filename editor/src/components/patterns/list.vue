<template>
    <div>
    <ul>
        <li v-for="pattern in patterns"
            :class="{ current : cur_pattern === pattern }"
            @click="set_current(pattern)">
            {{ pattern.name }}
        </li>
    </ul>
    <button @click="new_pattern">New Pattern</button>
    </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import store, { newgid } from 'chl/vue/store';

export default {
    name: 'pattern-list',
    store,
    computed: {
        patterns() {
            return this.$store.state.pattern.patterns;
        },
        ...mapGetters('pattern', [
            'cur_pattern',
            'unique_name',
        ]),
    },
    methods: {
        new_pattern() {
            let id = newgid();
            this.$store.commit('pattern/create', { id });
        },
        ...mapMutations('pattern', [
            'set_current'
        ])
    }
};
</script>
<style scoped>
.current {
    color: yellow;
}


</style>
