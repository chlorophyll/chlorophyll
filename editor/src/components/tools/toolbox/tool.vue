<template>
    <span>
        <div class="control">
            <button class="fill" :class="{ highlighted: enabled }" @click="selected">
                {{ label }}
            </button>
        </div>
        <slot />
    </span>
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
            required: true,
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
            this.$parent.selectTool(this);
        }
    },
    created() {
        this.enabled = this.isEnabled;
    },
    mounted() {
        this.$parent.addTool(this);
    },

};
</script>
