<template>
    <div class="control">
        <button v-bind:class="{ highlighted: highlight }"
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

<style>
</style>
