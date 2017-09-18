<template>
<div id="toolbar" class="litepanel inspector">
    <model-overlay
        :pixels="active_selection"
        :priority="10"
        :color="selection_color"
        :visible="true">
    </model-overlay>
    <template v-for="tool in tools">

        <highlight-button v-if="tool !== null"
            :label="tool.name"
            :highlight="tool.name == active"
            @click="active = tool.name">
        </highlight-button>
        <div v-else class="separator"></div>

    </template>
</div>
</template>

<script>
import keyboardJS from 'keyboardjs';
import { mapState } from 'vuex';
import store from 'chl/vue/store';

import HighlightButton from '@/components/widgets/highlight_button';
import ModelOverlay from '@/components/model_overlay';

export default {
    name: 'selection-toolbar',
    store,
    props: ['tools'],
    components: { HighlightButton, ModelOverlay },
    data() {
        return {
            active: null,
            /*
             * A tool is either null to indicate a separator, or an object:
             * { name, toolobj, hotkey (optional), momentary_hotkey (optional) }
             */
            selection_color: 0xffffff,
        };
    },
    computed: {
        ...mapState({
            active_selection: (state) => state.selection.active
        })
    },
    watch: {
        active(new_name, old_name) {
            let old_tool = null;
            let new_tool = null;
            // Lookup tools by name, so the active tool can be set without a
            // reference to the object itself.
            for (let tool of this.tools) {
                if (tool !== null) {
                    if (tool.name === new_name)
                        new_tool = tool;
                    if (tool.name === old_name)
                        old_tool = tool;
                }
            }
            // Catch not-found names.
            if (new_name !== null && new_tool === null)
                console.error('invalid tool:', new_tool);

            if (old_tool !== null)
                old_tool.toolobj.disable();

            if (new_tool !== null)
                new_tool.toolobj.enable();
        },
        tools(new_tools, old_tools) {
            for (let tool of this.tools) {
                if (tool === null) continue;
                if (tool.active === true) {
                    this.$nextTick(() => this.active = tool.name);
                }
                keyboardJS.bind(tool.hotkey, () => {
                    this.active = tool.name;
                });

                if (tool.momentary_hotkey !== undefined) {
                    let prev_name = null;
                    keyboardJS.bind(tool.momentary_hotkey, () => {
                        prev_name = this.active;
                        this.active = tool.name;
                    }, () => {
                        this.active = prev_name;
                    });
                }
            }

        }
    },
};
</script>

<style>
</style>
