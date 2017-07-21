<template>
    <div id="toolbar" class="litepanel inspector">
        <template v-for="tool in tools">

            <highlight-button v-if="tool !== null"
                :label="tool.name"
                :highlight="tool.name === active"
                @click="active = tool.name">
            </highlight-button>
            <div v-else class="separator"></div>

        </template>
    </div>
</template>

<script>
import keyboardJS from 'keyboardjs';
import HighlightButton from '@/components/widgets/highlight_button';

export default {
    name: 'viewport-toolbar',
    components: { HighlightButton },
    data() {
        return {
            menu: null,
            menu_dir: null,
            active: null,
            /*
             * A tool is either null to indicate a separator, or an object:
             * { name, toolobj, hotkey (optional), momentary_hotkey (optional) }
             */
            tools: [],
        };
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
            let self = this;

            for (let tool of new_tools) {
                if (tool === null)
                    continue;
                // Remove tools from consideration that weren't added/removed
                const oldidx = old_tools.indexOf(tool);
                if (oldidx !== -1) {
                    old_tools.splice(oldidx, 1);
                    continue;
                }
                // New tool, add to the dropdown menu and map the keybinding.
                if (self.menu && self.menu_dir) {
                    self.menu.add(self.menu_dir + '/' + tool.name, () => {
                        self.active = tool.name;
                    });
                }
                keyboardJS.withContext('global', () => {
                    keyboardJS.bind(tool.hotkey, () => {
                        self.active = tool.name;
                    });
                    let prev_name = null;
                    if ('momentary_hotkey' in tool) {
                        keyboardJS.bind(tool.momentary_hotkey, () => {
                            prev_name = self.active;
                            self.active = tool.name;
                        }, () => {
                            self.active = prev_name;
                        });
                    }
                });
            }
            // Anything left in the old list doesn't exist anymore, remove it.
            for (let tool of old_tools) {
                if (self.menu && self.menu_dir) {
                    self.menu.remove(self.menu_dir + '/' + tool.name);
                }
                keyboardJS.withContext('global', () => {
                    if ('hotkey' in tool)
                        keyboardJS.unbind(tool.hotkey);
                    if ('momentary_hotkey' in tool)
                        keyboardJS.unbind(tool.momentary_hotkey);
                });
            }
        },
    },
};
</script>

<style>
</style>
