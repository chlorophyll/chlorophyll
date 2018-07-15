<template>
    <div>
        <div class="panel-header" @click="toggleOpen">
            <span class="icon">{{ icon }}</span>
            {{ title }}
        </div>
        <div class="content" v-if="open">
            <slot></slot>
        </div>
    </div>
</template>

<script>
export default {
    name: 'collapsible-section',
    props: ['title', 'initially-open'],
    data() {
        return {
            open: this.initiallyOpen,
        };
    },
    computed: {
        icon() {
            return this.open ? '▼' : '►';
        }
    },
    methods: {
        toggleOpen() {
            this.open = !this.open;
        },
    }
};
</script>

<style scoped>
.panel-header {
    cursor: pointer;
    font-size: larger;
}
.icon {
    display: inline-block;
    width: 1.2em;
    padding-left: 0.5em;
}
</style>
