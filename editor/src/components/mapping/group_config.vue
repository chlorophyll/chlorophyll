<template>
  <div id="group-config" class="litepanel inspector">
    <div class="panel-header">Group settings: {{ name }} </div>
    <div class="widget full">
      <span class="wname">name</span>
      <input type="text" class="text string" v-model.lazy.trim="name">
    </div>
    <div class="widget full">
      <span class="wname">color</span>
      <color-picker v-model="color" />
    </div>
    <div class="panel-header">Add mapping for group</div>
    <div class="widget wcontent full">
      <select v-model="create_mapping_type" class="inputfield full inputcombo">
        <option v-for="(dispname, type) in mapping_types"
                v-bind:value="type">
          {{ dispname }}
        </option>
      </select>
    </div>
    <div class="widget wcontent full">
      <button class="litebutton single material-icons"
              @click="newMapping">
        +
      </button>
    </div>
  </div>
</template>

<script>
import { newgid } from 'chl/vue/store';
import { mappingUtilsMixin } from 'chl/mapping';
import { UniqueNameMixin } from 'chl/util';

import ColorPicker from '@/components/widgets/colorpicker';

export default {
    name: 'group-config',
    props: ['group'],
    mixins: [mappingUtilsMixin, UniqueNameMixin('Mapping', 'mapping/mapping_list')],
    components: { ColorPicker },
    data() {
        return {
            create_mapping_type: 'projection',
        };
    },
    computed: {
        name: {
            get() {
                return this.group.name;
            },
            set(val) {
                this.$store.commit('pixels/set_name', {
                    id: this.group.id,
                    name: val
                });
            }
        },
        color: {
            get() {
                return this.group.color;
            },
            set(color) {
                this.$store.commit('pixels/set_color', {
                    id: this.group.id,
                    color,
                });
            }
        }
    },
    methods: {
        newMapping(group) {
            const id = newgid();
            const name = this.uniqueMappingName();
            this.$store.commit('mapping/create_mapping', {
                id,
                name,
                group: this.group.id,
                type: this.create_mapping_type,
            });
            this.$emit('new_mapping', id);
        }
    }
};
</script>

<style scoped>
</style>

