<template>
  <div class="panel" id="pattern-list">
    <div class="panel-header">Patterns</div>
    <div class="content">
      <div class="flat-list" id="pattern-browser">
        <ul>
          <li v-for="pattern in pattern_list"
              :class="{ selected : cur_pattern === pattern }"
              @click="set_current(pattern)">
            {{ pattern.name }}
          </li>
        </ul>
      </div>
      <div class="control-row">
        <button @click="newPattern">New Pattern</button>
        <button :disabled="cur_pattern === null" @click="copyPattern">Copy Pattern</button>
      </div>
      <div id="cur-pattern" v-if="cur_pattern !== null">
        <section>
          <h1>{{ cur_name }} Settings</h1>
          <div class="controls">
            <div class="control-row">
              <label>Name</label><input type="text" v-model.lazy.trim="cur_name" />
            </div>
            <div class="control-row">
              <label>Type</label>
              <select v-model="cur_coord_type">
                <template v-for="(map_type_info, mapping_type) in available_coord_types">
                  <template v-for="(info, coord_type) in map_type_info.coord_types">
                    <option :value="{mapping_type, coord_type}">{{ info.name }}</option>
                  </template>
                </template>
              </select>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import store, { newgid } from 'chl/vue/store';

import { createPattern, copyPattern, setCoordType } from 'chl/patterns';

import { mappingTypes } from '@/common/mapping';

export default {
    name: 'pattern-list',
    store,
    computed: {
        cur_coord_type: {
            get() {
                const { mapping_type, coord_type } = this.cur_pattern;
                return { mapping_type, coord_type };
            },
            set({ mapping_type, coord_type}) {
                this.setCoordType(this.cur_pattern.id, mapping_type, coord_type);
            }
        },
        cur_name: {
            get() {
                return this.cur_pattern.name;
            },
            set(name) {
                this.$store.commit('pattern/set_name', { id: this.cur_pattern.id, name });
            }
        },
        available_coord_types() {
            return mappingTypes;
        },
        ...mapGetters('pattern', [
            'cur_pattern',
            'pattern_list',
        ]),
    },
    methods: {
        setCoordType: setCoordType,
        newPattern() {
            const id = newgid();
            createPattern(id, { set_current: true });
        },
        copyPattern() {
            copyPattern(this.cur_pattern, { set_current: true });
        },
        ...mapMutations('pattern', [
            'set_current',
        ])
    }
};
</script>
<style scoped>
#pattern-list {
    position: relative;
    height: 100%;
}

#pattern-browser {
  min-height: 7em;

}

.content {
  display: flex;
  flex-direction: column;
}

</style>
