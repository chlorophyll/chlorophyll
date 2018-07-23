<template>
    <div id="mapping-manager" class="panel">
        <div class="browser-container">
            <group-browser
                class="browser"
                :groups="group_list"
                :selected.sync="selected_gid" />
            <mapping-browser
                class="browser"
                :mappings="mapping_list"
                :selected.sync="selected_mid" />
            <div class="control-row browser-button-container">
                <button class="fill"
                        :disabled="!can_create_group"
                        @click="newGroupFromSelection()">
                    New group
                </button>
                <button class="fill">
                    New mapping
                </button>
            </div>
        </div>
    </div>
</template>

<script>

import { mapState } from 'vuex';
import store, { newgid } from 'chl/vue/store';
import { mappingUtilsMixin } from 'chl/mapping';
import { createGroup } from 'chl/model';

import GroupBrowser from '@/components/mapping/group_browser';
import MappingBrowser from '@/components/mapping/mapping_browser';
import MappingConfig from '@/components/mapping/mapping_config';
import GroupConfig from '@/components/mapping/group_config';
import SplitPane from '@/components/widgets/split';

export default {
    name: 'mapping-manager',
    store,
    mixins: [mappingUtilsMixin],
    components: {
        GroupBrowser,
        MappingBrowser,
        MappingConfig,
        GroupConfig,
        SplitPane,
    },
    data() {
        return {
            selected_gid: -1,
            selected_mid: -1,
        };
    },
    computed: {
        selected_group() {
            return this.getGroup(this.selected_gid);
        },
        selected_mapping() {
            return this.getMapping(this.selected_mid);
        },
        can_create_group() {
            return this.active_selection.length > 0;
        },
        ...mapState({
            active_selection: (state) => state.pixels.active_selection,
            group_list: (state) => state.pixels.group_list,
            mapping_list: (state) => state.mapping.mapping_list,
        })
    },
    methods: {
        newGroupFromSelection() {
            if (!this.can_create_group)
                return;

            const id = newgid();

            createGroup({id, pixels: [...this.active_selection]});
            this.$store.commit('pixels/clear_active_selection');
            this.selected_gid = id;
        },
    },
};
</script>

<style scoped>
.browser-container {
    display: flex;
    flex-direction: column;
}

.browser-button-container {
    align-content: flex-end;
}

</style>
