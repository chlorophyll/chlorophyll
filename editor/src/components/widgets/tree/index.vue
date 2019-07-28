<template>
    <div class="tree-container">
        <tree-view-list
            :items="items"
            :open-icon="openIcon"
            :closed-icon="closedIcon"
            :leaf-icon="leafIcon"
        >
            <template slot-scope="props">
                <slot :item="props.item" :leaf="props.leaf">
                <span>{{ props.item.label }}</span>
                </slot>
            </template>
        </tree-view-list>
    </div>
</template>

<script>

import TreeViewList from './list';

export default {
    name: 'tree-view',
    components: { TreeViewList },
    props: {
        items: Array,
        openIcon: {
            type: String,
            default: '▼',
        },
        closedIcon: {
            type: String,
            default: '►',
        },
        leafIcon: {
            type: String,
            default: '■',
        }
    },
};
</script>
