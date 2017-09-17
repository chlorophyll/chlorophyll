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
import { currentModel } from 'chl/init';
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
        ...mapState('mapping', {
            group_list: (state) => state.group_list,
            mapping_list: (state) => state.mapping_list,
        })
    },
    methods: {
        newGroupFromSelection() {
            if (this.$store.state.selection.active.length == 0)
                return;

            const id = newgid();
            this.$store.commit('mapping/create_group', {
                id,
                pixels: this.$store.state.selection.active
            });
            this.$store.commit('selection/clear');
            this.selected_id = id;
        },
    },
    mounted() {
        // Populate all pixels and inital strip groups
        let all_pixels = [];
        currentModel.forEach(function(_, pixel) {
            all_pixels.push(pixel);
        });
        this.$store.commit('mapping/create_group', {
            id: newgid(),
            name: 'All Pixels',
            pixels: all_pixels
        });

        for (let strip = 0; strip < currentModel.numStrips; strip++) {
            let pixels = [];
            currentModel.forEachPixelInStrip(strip, function(pixel) {
                pixels.push(pixel);
            });
            this.$store.commit('mapping/create_group', {
                id: newgid(),
                name: `Strip ${strip + 1}`,
                pixels: pixels
            });
        }
    }
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
