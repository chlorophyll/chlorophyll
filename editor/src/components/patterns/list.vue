<template>
    <div>
    <ul>
        <li v-for="pattern in pattern_list"
            :class="{ current : cur_pattern === pattern }"
            @click="set_current(pattern)">
            {{ pattern.name }}
        </li>
    </ul>
    <button @click="newPattern">New Pattern</button>
    <button @click="copyPattern">Copy Pattern</button>
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

import { createPattern, copyPattern, setCoordType } from 'chl/patterns';

import { mappingTypes } from '@/common/mapping';

import { UniqueNameMixin } from 'chl/util';

export default {
    name: 'pattern-list',
    store,
    computed: {
        cur_coord_type: {
            get() {
                const { mapping_type, coord_type } = this.cur_pattern;
                return { mapping_type, coord_type };
            },
            set({ mapping_type, coord_type}) {
                this.setCoordType(this.cur_pattern.id, mapping_type, coord_type);
            }
        },
        available_coord_types() {
            return mappingTypes;
        },
        ...mapGetters('pattern', [
            'cur_pattern',
            'pattern_list',
        ]),
    },
    methods: {
        setCoordType: setCoordType,
        newPattern() {
            const id = newgid();
            createPattern(id, { set_current: true });
        },
        copyPattern() {
            copyPattern(this.cur_pattern, { set_current: true });
        },
        ...mapMutations('pattern', [
            'set_current',
        ])
    }
};
</script>
<style scoped>
.current {
    color: yellow;
}


</style>
