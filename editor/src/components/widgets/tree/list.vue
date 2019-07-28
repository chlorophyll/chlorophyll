<template>
    <ul class="tree">
        <template v-for="child in items">
            <tree-item :item="child"
                :open-icon="openIcon"
                :closed-icon="closedIcon"
                :leaf-icon="leafIcon"
            >
                <template slot-scope="props">
                    <slot :item="props.item" :leaf="props.leaf" />
                </template>
            </tree-item>
        </template>
    </ul>
</template>

<script>

export default {
    name: 'tree-view-list',
    props: {
        items: Array,
        openIcon: String,
        closedIcon: String,
        leafIcon: String,
    },
    beforeCreate() {
        this.$options.components.TreeItem = require('./item.vue').default;
    },
    computed: {
        hasChildren() {
            return this.items && this.items.length > 0;
        }
    }
};
</script>
