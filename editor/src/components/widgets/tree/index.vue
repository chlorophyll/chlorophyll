<template>
    <ul class="tree">
        <template v-for="child in items">
            <tree-item :item="child">
                <template scope="props">
                    <slot :item="props.item" :leaf="props.leaf">
                    <span>{{ props.item.label }}</span>
                    </slot>
                </template>
            </tree-item>
        </template>
    </ul>
</template>

<script>

export default {
    name: 'tree-view',
    props: {
        items: Array
    },
    beforeCreate() {
        this.$options.components.TreeItem = require('./item.vue');
    },
    computed: {
        hasChildren() {
            return this.items && this.items.length > 0;
        }
    }
};
</script>
<style scoped>
.tree {
    list-style: none;
    padding-left: 0;
    margin-left: 0;
}
</style>
