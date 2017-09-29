<template>
    <div class="panel">
        <slot />
    </div>
</template>

<script>
import keyboardJS from 'keyboardjs';
export default {
    name: 'toolbox',
    data() {
        return {
            tools: [],
            current: null,
        };
    },
    methods: {
        selectTool(tool) {
            this.current = tool;
            this.tools.forEach((child) => child.enabled = (child === tool));
        },
        addTool(tool) {
            this.tools.push(tool);
            if (tool.enabled && !this.current) {
                this.selectTool(tool);
            }
            keyboardJS.bind(tool.hotkey, () => this.selectTool(tool));

            if (tool.momentaryHotkey !== undefined) {
                let prev_tool = null;
                keyboardJS.bind(tool.momentaryHotkey, () => {
                    prev_tool = this.current;
                    this.selectTool(tool);
                }, () => {
                    this.selectTool(prev_tool);
                });
            }
        }
    }
};
</script>
