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
    <template v-if="cur_pattern !== null">
    <hr />
    Current pattern: {{ cur_pattern.name }}
    <select v-model="cur_coord_type">
        <template v-for="(map_type_info, mapping_type) in available_coord_types">
            <template v-for="(info, coord_type) in map_type_info.coord_types">
                <option :value="{mapping_type, coord_type}">{{ info.name }}</option>
            </template>
        </template>
    </select>
    </template>
    </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import store, { newgid } from 'chl/vue/store';

import { mappingTypes } from 'chl/mapping';

export default {
    name: 'pattern-list',
    store,
    computed: {
        patterns() {
            return this.$store.state.pattern.patterns;
        },
        cur_coord_type: {
            get() {
                const { mapping_type, coord_type } = this.cur_pattern;
                return { mapping_type, coord_type };
            },
            set(map_info) {
                this.set_coord_type({id: this.cur_pattern.id, ...map_info});
            }
        },
        available_coord_types() {
            return mappingTypes;
        },
        ...mapGetters('pattern', [
            'cur_pattern',
            'unique_name',
        ]),
    },
    methods: {
        new_pattern() {
            let id = newgid();
            let name = this.unique_name;
            this.$store.commit('pattern/create', { id, name });
        },
        ...mapMutations('pattern', [
            'set_current',
            'set_coord_type',
        ])
    }
};
</script>
<style scoped>
.current {
    color: yellow;
}


</style>
