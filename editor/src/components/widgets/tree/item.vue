<template>
    <li class="item" v-bind:class="{withChildren: hasChildren}">
        <div class="label" v-bind:class="{ selected: item.selected }"
             @click="toggle">
            <span class="icon">{{ icon }}</span>
            <slot :item="item" :leaf="!hasChildren" />
        </div>

        <tree-view-list v-show="open" v-if="hasChildren" :items="item.children">
            <template slot-scope="props">
                <slot :item="props.item" :leaf="props.leaf" />
            </template>
        </tree-view-list>
    </li>
</template>

<script>
import TreeViewList from './list';

export default {
    name: 'tree-item',
    components: { TreeViewList },
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
    },
    watch: {
        item(new_item) {
            if (new_item.children.find((c) => c.selected) !== undefined) {
                if (!this.open)
                    this.toggle();
            }
        }
    }
};
</script>
<style scoped>

/*
.label {
    padding-left: 100%;
    margin-left: -100%;
    border-bottom: 1px solid rgba(0,0,0, 0.1);
}

div.label.selected {
    background-color: #2c5a75;
}

.label:hover {
    background-color: #444;
}

*/


.icon {
}

</style>
