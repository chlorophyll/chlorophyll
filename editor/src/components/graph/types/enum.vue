
<template>
  <div class="control-row">
    <label>{{ name }}</label>
    <select v-model="current">
      <option v-for="(description, item) in options" :value="item">
        {{ description }}
      </option>
    </select>
  </div>
</template>

<script>
import _ from 'lodash';
import { NodeConfigMixin } from 'chl/graphlib';

export default {
    name: 'graph-type-enum',
    mixins: [NodeConfigMixin],
    computed: {
        current: {
            get() {
                return this.value.valueOf();
            },
            set(val) {
                this.value.value = val;
            }
        },

        options() {
            let prettyNames = this.value.descriptions;
            if (!prettyNames)
                prettyNames = this.value.enumValues.map(x => {
                    if (_.isString(x))
                        return x;
                    else if (_.isFunction(x.toString))
                        return x.toString();
                    else
                        return '';
                });

            return _.zipObject(this.value.enumValues, prettyNames);
        }
    }
};
</script>
