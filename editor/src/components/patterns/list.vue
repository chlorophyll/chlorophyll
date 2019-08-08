<template>
  <div class="panel" id="pattern-list">
    <h1>Patterns</h1>
    <hr>

    <div class="control-row">
      <button @click="newPattern"
              class="control fill">
        New Pattern
      </button>
    </div>

    <div class="flat-list">
      <ul>
        <li v-for="pattern in pattern_list"
            :class="{ selected : cur_pattern === pattern }"
            @click="set_current(pattern)"
            @dblclick="patternDblClick(pattern)">
          {{ pattern.name }}
        </li>
      </ul>
    </div>

    <div v-if="cur_pattern !== null">
      <section>
        <div class="controls">
          <div class="control-row">
            <label>Name</label>
            <input type="text" class="control"
                   v-model.lazy.trim="cur_name" />
          </div>

          <div class="control-row">
            <label>Type</label>
            <select v-model="cur_coord_type" class="control">
              <template v-for="Mapping in allMappings">
                <template v-for="view in Mapping.views">
                  <option :value="{mapping_type: Mapping.className, coord_type: view.className}">
                    {{ view.displayName }}
                  </option>
                </template>
              </template>
            </select>
          </div>
          <hr>

          <div class="control-row no-label">
            <button @click="copyPattern"
                    class="control">
              Duplicate
            </button>
            <button @click="deleteCurrent"
                    class="control small-right material-icons warn">
              delete
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import store, { newgid } from 'chl/vue/store';

import { createPattern, copyPattern, setCoordType } from 'chl/patterns';

import { mappingTypes } from '@/common/mapping';

import SplitPane from '@/components/widgets/split';

export default {
    name: 'pattern-list',
    store,
    components: { SplitPane },
    computed: {
        cur_coord_type: {
            get() {
                const { mapping_type, coord_type } = this.cur_pattern;
                return { mapping_type, coord_type };
            },
            set({ mapping_type, coord_type}) {
                setCoordType(this.cur_pattern.id, mapping_type, coord_type);
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
        allMappings() {
            return Object.values(mappingTypes);
        },
        ...mapGetters('pattern', [
            'cur_pattern',
            'pattern_list',
        ]),
    },
    methods: {
        newPattern() {
            const id = newgid();
            createPattern(id, { set_current: true });
            this.$emit('new-pattern');
        },
        copyPattern() {
            copyPattern(this.cur_pattern, { set_current: true });
        },
        deleteCurrent() {
            this.$store.commit('pattern/delete', this.cur_pattern);
        },
        patternDblClick(pattern) {
            this.$emit('pattern-dblclick', pattern);
        },
        ...mapMutations('pattern', [
            'set_current',
        ])
    }
};
</script>
<style scoped>
#pattern-list {
  display: flex;
  flex-direction: column;
}
.flat-list {
  flex: 1;
}
</style>
