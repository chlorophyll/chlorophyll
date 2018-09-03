<template>
<div>
  <div id="mapping-config" class="panel">
    <section>
      <h1>Mapping settings</h1>

      <div class="controls">
        <div class="control-row">
          <label>name</label>
          <input type="text" v-model.lazy.trim="name" class="control">
        </div>
        <div class="control-row">
          <label>type</label>
          <select v-model="type" class="control">
            <option v-for="(dispname, type) in mapping_types"
                    v-bind:value="type">
              {{ dispname }}
            </option>
          </select>
        </div>
        <hr>
        <div class="control-row no-label">
          <button @click="configure" class="control">
            Configure Mapping
          </button>
          <button @click="deleteCurrent"
                  class="control small-right material-icons warn">
            delete
          </button>
        </div>
      </div>
    </section>
  </div>
  <dialog-box v-if="configuring"
              title="Configure mapping"
              :width="configWidth"
              :pos="{ x: 250, y: 100 }"
              :show="true"
              @close="endConfigure">
      <component v-bind:is="mapping.type"
                 v-model="working_settings" />
  </dialog-box>
</div>
</template>

<script>
import { mappingUtilsMixin } from 'chl/mapping';

import ProjectionConfig from './config/projection';
import TransformConfig from './config/transform';
import LinearConfig from './config/linear';

import DialogBox from '@/components/widgets/dialog_box';

export default {
    name: 'mapping-config',
    props: ['mapping'],
    mixins: [mappingUtilsMixin],
    components: {
        DialogBox,
        'projection': ProjectionConfig,
        'transform': TransformConfig,
        'linear': LinearConfig,
    },

    data() {
        return {
            working_settings: {},
            configuring: false,
        };
    },
    computed: {
        name: {
            get() { return this.mapping.name; },
            set(val) {
                this.$store.commit('mapping/update_mapping', {
                    id: this.mapping.id,
                    props: { name: val }
                });
            }
        },

        type: {
            get() { return this.mapping.type; },
            set(val) {
                this.$store.commit('mapping/set_mapping_type', {
                    id: this.mapping.id,
                    type: val
                });
            }
        },

        configWidth() {
            if (this.mapping.type === 'projection')
                return '700px';
            else
                return '300px';
        }
    },
    beforeDestroy() {
        if (this.configuring)
            this.endConfigure(false);
    },
    methods: {
        configure() {
            this.configuring = true;
            this.$set(this, 'working_settings', this.copyMappingSettings(this.mapping));
        },
        endConfigure(save_result) {
            if (save_result) {
                this.$store.commit('mapping/update_mapping', {
                    id: this.mapping.id,
                    props: {
                        settings: this.working_settings
                    }
                });
            }
            this.configuring = false;
            this.working_settings = {};
        },
        deleteCurrent() {
            this.$store.commit('mapping/delete', this.mapping);
        }
    }
};
</script>

<style>
</style>
