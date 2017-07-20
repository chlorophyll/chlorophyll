<template>
    <div class="widget wcontent full">
        <button class="litebutton single"
            v-bind:class="{ highlighted: highlight }"
            @click="$emit('click')">
            {{ label }}
        </button>
    </div>
</template>

<script>
export default {
    name: 'highlight-button',
    props: ['label', 'highlight'],
};
</script>

<style scoped>
    button.highlighted {
        background: transparent linear-gradient(#ed5f0e, #b7551d) repeat scroll
            0px 0px !important;
    }
</style>
