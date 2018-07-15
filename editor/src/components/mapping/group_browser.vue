<template>
  <collapsible-section class="group-browser" title="Groups" :initially-open="true">
  <div class="flat-list">
      <ul>
          <li v-for="group in group_info"
              :class="{ selected: selected == group.id }"
              @click="select(group.id)"
          >
          {{ group.name }}
          <span class="inline-controls">
              <div class="visibility-button">
              <span
                class="material-icons"
                @click.stop="toggleVisibility(group)">{{ visibilityText(group) }}</span>
              </div>
              <colorpicker-inline
                :value="group.color"
                @input="(val) => setColor(group.id, val)" />
          </span>
          </li>
      </ul>
  </div>
  <group-config v-if="selected_group" :group="selected_group" />
  </collapsible-section>
</template>

<script>

import { mappingUtilsMixin } from 'chl/mapping';
import store from 'chl/vue/store';

import ColorpickerInline from '@/components/widgets/colorpicker/inline';
import GroupConfig from '@/components/mapping/group_config';
import CollapsibleSection from '@/components/widgets/collapsible_section';

export default {
    store,
    name: 'group-browser',
    components: { ColorpickerInline, GroupConfig, CollapsibleSection },
    mixins: [mappingUtilsMixin],
    props: ['groups', 'selected'],
    computed: {
        group_info() {
            return this.groups.map(gid => this.getGroup(gid));
        },
        selected_group() {
            return this.getGroup(this.selected);
        },
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

.group-browser .flat-list {
    height: 7em;
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

</style>
