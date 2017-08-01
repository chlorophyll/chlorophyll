<template>
    <li class="item" v-bind:class="{withChildren: hasChildren}">
        <div @click="toggle" class="label">
        <span class="icon">{{ icon }}</span>
        <slot :item="item" :leaf="!hasChildren" />
        </div>

        <tree-view v-show="open" v-if="hasChildren" :items="item.children">
            <template scope="props">
                <slot :item="props.item" :leaf="props.leaf" />
            </template>
        </tree-view>
    </li>
</template>

<script>
import TreeView from './index';

export default {
    name: 'tree-item',
    components: { TreeView },
    props: {
        item: Object
    },
    data: function() {
        return {
            open: false,
        };
    },
    computed: {
        hasChildren() {
            let ret = this.item.children && this.item.children.length > 0;
            return ret;
        },
        icon() {
            if (this.hasChildren) {
                return this.open ? '▼' : '►';
            } else {
                return '■';
            }
        },
    },
    methods: {
        toggle: function() {
            if (this.hasChildren) {
                this.open = !this.open;
            }
        },
    }
};
</script>
<style scoped>

.item {
    padding-left: 1.5em;
    margin-top: 2px;
    margin-bottom: 2px;
    user-select: none;
}

.label {
    padding-left: 100%;
    margin-left: -100%;
    border-bottom: 1px solid rgba(0,0,0, 0.1);
}

.label:hover {
    background-color: #444;
}

.item.withChildren {
    cursor: pointer;
}

.icon {
    display: block;
    float: left;
    color: #79a;
    vertical-align: middle;
}

</style>
