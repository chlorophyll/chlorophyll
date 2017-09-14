<template>
  <div id="mapping-config" class="litepanel inspector">
    <div class="panel-header">
        {{ mappingDisplayName(type) }} Mapping settings
    </div>
    <div class="widget full">
      <span class="wname">name</span>
      <input type="text" class="text string" v-model.lazy.trim="name">
    </div>
    <div class="widget full">
      <span class="wname">type</span>
      <select v-model="type" class="inputfield inputcombo full">
        <option v-for="(dispname, type) in mapping_types"
                v-bind:value="type">
          {{ dispname }}
        </option>
      </select>
    </div>
    <div class="widget wcontent full">
      <button class="litebutton single" @click="configure">
        Configure Mapping
      </button>
    </div>
    <modal-dialog v-if="configuring"
                  title="Configure mapping"
                  width="300px"
                  :pos="{ x: 400, y: 400 }"
                  :show="true"
                  @close="endConfigure">
        <component v-bind:is="mapping.type"
                   v-model="working_settings" />
    </modal-dialog>
  </div>
</template>

<script>
import * as THREE from 'three';
import { mappingUtilsMixin } from 'chl/mapping/maputil';
import { screenManager } from 'chl/init';
import Util from 'chl/util';

import ProjectionConfig from '@/components/mapping/projection_config';

import ModalDialog from '@/components/widgets/modal_dialog';
import VectorInput from '@/components/widgets/vector_input';
import ViewportAxes from '@/components/widgets/viewport_axes';

export default {
    name: 'mapping-config',
    props: ['mapping'],
    mixins: [mappingUtilsMixin],
    components: {
        ModalDialog,
        'projection': ProjectionConfig,
        /* 'transform': TransformConfig */
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
                this.$store.commit('mapping/update_mapping', {
                    id: this.mapping.id,
                    props: { type: val }
                });
            }
        },
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
        }
    }
};
</script>

<style>
/* Hack around litegui badness */
.inputcombo {
    color: #5AF;
}
</style>
