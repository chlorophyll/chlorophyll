<template>
    <div id="mapping-manager" class="litepanel inspector">
        <split-pane direction="vertical" :initial-split="[200,null]">
            <div slot="first" class="browser-container litepanel">
                <mapping-browser
                    :mappings="mapping_list"
                    :groups="group_list"
                    :selected.sync="selected_id">
                </mapping-browser>
                <div class="browser-button-container widget wcontent full">
                    <button class="litebutton single"
                            :disabled="!can_create_group"
                            @click="newGroupFromSelection()">
                        New group from selection
                    </button>
                </div>
            </div>
            <mapping-config v-if="selected_mapping"
                slot="second"
                :mapping="selected_mapping">
            </mapping-config>
            <group-config v-if="selected_group"
                slot="second"
                :group="selected_group"
                @new_mapping="val => { selected_id = val; }">
            </group-config>
        </split-pane>
    </div>
</template>

<script>
import { mapState } from 'vuex';
import store, { newgid } from 'chl/vue/store';
import { mappingUtilsMixin } from 'chl/mapping';

import MappingBrowser from '@/components/mapping/browser';
import MappingConfig from '@/components/mapping/mapping_config';
import GroupConfig from '@/components/mapping/group_config';
import SplitPane from '@/components/widgets/split';

/*
 * TODO: Once tree and splitter components pulled in, this will contain the
 * top group/mapping browser component and the bottom config component.
 */
export default {
    name: 'mapping-manager',
    store,
    mixins: [mappingUtilsMixin],
    components: {
        MappingBrowser,
        MappingConfig,
        GroupConfig,
        SplitPane,
    },
    data() {
        return {
            selected_id: -1,
        };
    },
    computed: {
        selected_mapping() {
            return this.getMapping(this.selected_id);
        },
        selected_group() {
            return this.getGroup(this.selected_id);
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
            this.selected_id = id;
        },
    },
};
</script>

<style scoped>
.browser-container {
    position: relative;
    height: 100%;
    padding-bottom: 45px;
}

.browser-button-container {
    position: absolute;
    bottom: 0;
}

</style>
