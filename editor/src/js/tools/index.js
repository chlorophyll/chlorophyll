export const ToolMixin = {
    data() {
        return {
            enabled: false,
        };
    },
    mounted() {
        this.$parent.$on('enabled', (val) => this.enabled = val);
    }
};
