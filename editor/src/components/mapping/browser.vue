<template>
<div id="mapping-browser">
  <div class="panel-header">Mapping Browser</div>
  <div class="tree-container">
    <tree-view :items="treeItems">
      <template scope="props">
        <div class="item ltreeitem"
             @click="select(props.item.id)">
          {{ props.item.label }}
          <span v-if="props.item.type == 'group'">
              <colorpicker-inline
                :value="props.item.color"
                @input="(val) => setColor(props.item.id, val)" />
          </span>
        </div>
      </template>
    </tree-view>
  </div>
</div>
</template>

<script>
import { mappingUtilsMixin } from 'chl/mapping';
import store from 'chl/vue/store';

import TreeView from '@/components/widgets/tree/index';
import ColorpickerInline from '@/components/widgets/colorpicker/inline';

export default {
    store,
    name: 'mapping-browser',
    components: { TreeView, ColorpickerInline },
    mixins: [mappingUtilsMixin],
    props: ['groups', 'mappings', 'selected'],
    computed: {
        treeItems() {
            // Grab to trigger dependency tracking
            const groups = this.groups;
            const mappings = this.mappings;
            let items = [];
            for (let gid of groups) {
                const group = this.getGroup(gid);
                let children = [];
                for (let mid of mappings) {
                    const mapping = this.getMapping(mid);
                    if (mapping.group == gid) {
                        children.push({
                            label: mapping.name,
                            type: 'mapping',
                            children: [],
                            selected: (this.selected == mid),
                            id: mid,
                        });
                    }
                }
                items.push({
                    label: group.name,
                    type: 'group',
                    children,
                    selected: (this.selected == gid),
                    id: gid,
                    color: group.color,
                });
            }
            return items;
        }
    },
    methods: {
        select(id) {
            this.$emit('update:selected', id);
        },
        setColor(id, color) {
            this.$store.commit('pixels/set_color', { id, color });
        }
    }
};
</script>

<style scoped>
#mapping-browser {
    height: 100%;
}

.tree-container {
    height: 100%;
    background: #181818;
    overflow-y: auto;
}
</style>
