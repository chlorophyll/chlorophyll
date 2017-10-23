<template>
    <div class="tree-container">
        <tree-view-list :items="items">
            <template scope="props">
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
        items: Array
    },
};
</script>
