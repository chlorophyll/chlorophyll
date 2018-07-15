<template>
  <collapsible-section class="mapping-browser" title="Mappings" initially-open="true">
    <div class="flat-list">
        <ul>
            <li v-for="mapping in mapping_info"
                :class="{ selected: selected == mapping.id }"
                @click="select(mapping.id)"
            >{{ mapping.name }}</li>
        </ul>
    </div>
    <mapping-config v-if="selected_mapping" :mapping="selected_mapping" />
  </collapsible-section>
</template>

<script>
import { mappingUtilsMixin } from 'chl/mapping';
import store from 'chl/vue/store';

import MappingConfig from '@/components/mapping/mapping_config';
import CollapsibleSection from '@/components/widgets/collapsible_section';

export default {
    name: 'mapping-browser',
    store,
    mixins: [mappingUtilsMixin],
    components: { MappingConfig, CollapsibleSection },
    props: ['mappings', 'selected'],
    computed: {
        mapping_info() {
            return this.mappings.map(mid => this.getMapping(mid));
        },
        selected_mapping() {
            return this.getMapping(this.selected);
        },
    },
    methods: {
        select(id) {
            this.$emit('update:selected', id);
        }
    }
};
</script>

<style scoped>
.mapping-browser .flat-list {
    height: 5em;
}
</style>
