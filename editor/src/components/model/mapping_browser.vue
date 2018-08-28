<template>
  <div class="panel mapping-browser">
    <div class="panel-header">Mappings</div>
    <div class="flat-list" @click="select(-1)">
        <ul>
            <li v-for="mapping in mapping_info"
                :class="{ selected: selected_mid == mapping.id }"
                @click.stop="select(mapping.id)"
            >{{ mapping.name }}</li>
        </ul>
    </div>
    <div class="control-row">
      <button @click="newMapping" class="control fill">New mapping</button>
      <select v-model="create_mapping_type" class="control fill">
        <option v-for="(dispname, type) in mapping_types"
                v-bind:value="type">
          {{ dispname }}
        </option>
      </select>
    </div>

    <mapping-config v-if="selected_mapping" :mapping="selected_mapping" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { mappingUtilsMixin } from 'chl/mapping';
import { UniqueNameMixin } from 'chl/util';
import store, { newgid } from 'chl/vue/store';

import MappingConfig from '@/components/model/mapping_config';

export default {
    name: 'mapping-browser',
    store,
    mixins: [mappingUtilsMixin, UniqueNameMixin('Mapping', 'mapping/mapping_list')],
    components: { MappingConfig },
    data() {
        return {
            selected_mid: -1,
            create_mapping_type: 'projection',
        };
    },
    computed: {
        ...mapState({
            mapping_list: (state) => state.mapping.mapping_list,
        }),
        mapping_info() {
            return this.mapping_list.map(mid => this.getMapping(mid));
        },
        selected_mapping() {
            return this.getMapping(this.selected_mid);
        },
    },
    methods: {
        select(id) {
          this.selected_mid = id;
        },
        newMapping() {
            const id = newgid();
            const name = this.uniqueMappingName();
            this.$store.commit('mapping/create_mapping', {
                id,
                name,
                type: this.create_mapping_type,
            });
            this.selected_mid = id;
        }
    }
};
</script>

<style scoped>
.mapping-browser .flat-list {
    height: 10em;
}

.panel-header {
    font-size: larger;
}
</style>
