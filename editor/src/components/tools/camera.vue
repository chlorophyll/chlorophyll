<template><span/></template>
<script>
import { ToolMixin } from 'chl/tools';

export default {
    name: 'camera',
    mixins: [ToolMixin],
    inject: ['localViewport'],
    watch: {
        enabled() {
            if (this.localViewport)
                this.localViewport.controlsEnabled = this.enabled;
        }
    }
};
</script>
