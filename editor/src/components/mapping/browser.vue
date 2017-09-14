<template>
<div id="mapping-browser">
  <div class="panel-header">Mapping Browser</div>
  <div class="tree-container">
    <tree-view :items="treeItems">
      <template scope="props">
        <div class="item ltreeitem"
             @click="select(props.item.id)">
          {{ props.item.label }}
        </div>
      </template>
    </tree-view>
  </div>
  <model-overlay v-for="gid in groups" :key="gid"
     :pixels="getGroup(gid).pixels"
     :color="getGroup(gid).color"
     :visible="getGroup(gid).visible"
     :priority="1">
  </model-overlay>
</div>
</template>

<script>
import { mappingUtilsMixin } from 'chl/mapping/maputil';

import TreeView from '@/components/widgets/tree/index';
import ModelOverlay from '@/components/model_overlay';

export default {
    name: 'mapping-browser',
    components: { TreeView, ModelOverlay },
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
                            children: [],
                            selected: (this.selected == mid),
                            id: mid,
                        });
                    }
                }
                items.push({
                    label: group.name,
                    children,
                    selected: (this.selected == gid),
                    id: gid,
                });
            }
            return items;
        }
    },
    methods: {
        select(id) {
            this.$emit('update:selected', id);
        },
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
