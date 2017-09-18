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
import store from 'chl/vue/store';
import Util from 'chl/util';
import { mapGetters, mapMutations } from 'vuex';
import { create_pattern } from 'chl/patterns';
export default {
    name: 'pattern-list',
    store,
    computed: {
        patterns() {
            return this.$store.state.pattern.patterns;
        },
        pattern_names() {
            let o = Object.values(this.patterns).map((pattern) => pattern.name);
            return o;
        },
        ...mapGetters('pattern', [
            'cur_pattern',
        ]),
    },
    methods: {
        new_pattern() {
            let name = Util.uniqueName('pattern-', this.pattern_names);
            create_pattern(name);
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
