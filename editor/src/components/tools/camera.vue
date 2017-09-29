<template><span/></template>
<script>
import { activeScreen } from 'chl/viewport';
import { ToolMixin } from 'chl/tools';

export default {
    name: 'camera',
    mixins: [ToolMixin],
    watch: {
        enabled() {
            activeScreen().controlsEnabled = this.enabled;
        }
    }
};
</script>
