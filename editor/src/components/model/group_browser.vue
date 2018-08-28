<template>
  <div class="panel group-browser">
    <h1>Groups</h1>
    <hr>

    <div class="control-row">
      <button class="control fill"
              :disabled="!can_create_group"
              @click="newGroupFromSelection()">
        New group from selection
      </button>
    </div>

    <div class="flat-list" @click="select(-1)">
      <ul>
        <li v-for="group in group_info"
            :class="{ selected: selected_gid == group.id }"
            @click.stop="select(group.id)">
          {{ group.name }}
          <span class="inline-controls">
            <div class="visibility-button">
              <span class="material-icons"
                    @click.stop="toggleVisibility(group)">
                {{ visibilityText(group) }}
              </span>
            </div>
            <colorpicker-inline
                 :value="group.color"
                 @input="(val) => setColor(group.id, val)" />
          </span>
        </li>
      </ul>
    </div>
    <group-config v-if="selected_group" :group="selected_group" />
  </div>
</template>

<script>
import { mapState } from 'vuex';
import { mappingUtilsMixin } from 'chl/mapping';
import { createGroup } from 'chl/model';
import store, { newgid } from 'chl/vue/store';

import ColorpickerInline from '@/components/widgets/colorpicker/inline';
import GroupConfig from '@/components/model/group_config';

export default {
    store,
    name: 'group-browser',
    components: { ColorpickerInline, GroupConfig },
    mixins: [mappingUtilsMixin],
    data() {
        return {
            selected_gid: -1,
        };
    },
    computed: {
        ...mapState({
            active_selection: (state) => state.pixels.active_selection,
            group_list: (state) => state.pixels.group_list,
        }),
        group_info() {
            return this.group_list.map(gid => this.getGroup(gid));
        },
        selected_group() {
            return this.getGroup(this.selected_gid);
        },
        can_create_group() {
            return this.active_selection.length > 0;
        },
    },
    methods: {
        visibilityText({visible}) {
            return visible ? 'visibility' : 'visibility_off';
        },
        select(id) {
            this.selected_gid = id;
        },
        setColor(id, color) {
            this.$store.commit('pixels/set_color', { id, color });
        },
        toggleVisibility({id, visible}) {
            visible = !visible;
            this.$store.commit('pixels/set_visible', { id, visible });
        },
        newGroupFromSelection() {
            if (!this.can_create_group)
                return;

            const id = newgid();

            createGroup({id, pixels: [...this.active_selection]});
            this.$store.commit('pixels/clear_active_selection');
            this.selected_gid = id;
        },
    }
};
</script>

<style scoped>
.group-browser .flat-list {
    height: 10em;
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
