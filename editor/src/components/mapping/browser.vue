<template>
<div id="mapping-browser">
  <div class="panel-header">Mapping Browser</div>
    <tree-view class="tree-view" :items="treeItems">
      <template slot-scope="props">
        <div class="item ltreeitem"
             @click="select(props.item.id)">
          {{ props.item.label }}
          <span v-if="props.item.type == 'group'" class="inline-controls">
              <div class="visibility-button" @click.stop="toggleVisibility(props.item)">
                  <span class="material-icons">{{ visibilityText(props.item) }}</span>
              </div>
              <colorpicker-inline
                :value="props.item.color"
                @input="(val) => setColor(props.item.id, val)" />
          </span>
        </div>
      </template>
    </tree-view>
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
                    visible: group.visible,
                });
            }
            return items;
        }
    },
    methods: {
        visibilityText({visible}) {
            return visible ? 'visibility' : 'visibility_off';
        },
        select(id) {
            this.$emit('update:selected', id);
        },
        setColor(id, color) {
            this.$store.commit('pixels/set_color', { id, color });
        },
        toggleVisibility({id, visible}) {
            visible = !visible;
            this.$store.commit('pixels/set_visible', { id, visible });
        }
    }
};
</script>

<style scoped>
#mapping-browser {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.inline-controls {
    float: right;
    padding-right: 1em;
}

.visibility-button {
    display: inline-block;
    cursor: pointer;
    vertical-align: middle;
    margin-right: 0.5em;
}

#mapping-browser .panel-header {
    flex: 0 0 auto;
}

#mapping-browser .tree-view {
    flex: 1;
}
</style>
