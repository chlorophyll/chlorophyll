<template>
    <div class="control">
        <button class="smol" :class="{ highlighted: enabled }" @click="selected">
            <span :class="labelClasses">{{ label }}</span>
        </button>
        <slot />
    </div>
</template>

<script>
export default {
    name: 'tool',
    data() {
        return {
            enabled: false,
        };
    },
    props: {
        label: {
            type: String,
        },
        labelClasses: {
            type: String,
        },
        hotkey: {
            required: true,
            type: String,
        },
        momentaryHotkey: {
            required: false,
            type: String,
        },
        isEnabled: {
            required: false,
            type: Boolean,
            default: false,
        },
    },

    watch: {
        enabled() {
            this.$emit('enabled', this.enabled);
        }
    },

    methods: {
        selected() {
            if (!this.$parent.selectTool)
                return;

            this.$parent.selectTool(this);
        }
    },
    created() {
        this.enabled = this.isEnabled;
    },
    mounted() {
        if (!this.$parent.addTool)
            return;

        this.$parent.addTool(this);
    },

};
</script>

<style scoped>

.control {
    display: inline-block;
}

</style>
