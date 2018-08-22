<template>
  <div class="control-row">
    <label>{{ name }}</label>
    <input type="text" v-model.lazy.trim="current" class="control">
  </div>
</template>

<script>
import { NodeConfigMixin } from 'chl/graphlib';

export default {
    name: 'graph-type-string',
    mixins: [NodeConfigMixin],
    computed: {
        current: {
            get() {
                return this.value || '';
            },
            set(val) {
                this.value = val;
            }
        }
    }
};
</script>
