<template>
<div class="panel">

  <div class="flat-list">
    <ul>
      <li v-for="pixelIdx in value.pixels">
        Pixel {{ pixelIdx }}
      </li>
    </ul>
  </div>

  <div class="control-row">
    <label>Modify group</label>
    <select v-model="selectedGroup" class="control fill">
      <option v-for="group in groupList"
              :value="group">
        {{ group.name }}
      </option>
    </select>
  </div>

  <div class="control-row">
    <label></label>
    <button @click="addCurrent" class="control fill material-icons">add</button>
    <button @click="removeCurrent" class="control fill material-icons">remove</button>
  </div>

</div>
</template>

<script>
import { mapState } from 'vuex';
import store from 'chl/vue/store';
import { mappingUtilsMixin } from 'chl/mapping';
import { addGroup, removeGroup } from '@/common/mapping/linear';

export default {
    name: 'linear-config',
    props: ['value'],
    mixins: [mappingUtilsMixin],
    store,
    data() {
        return {
            selectedGroup: null
        };
    },
    computed: {
        ...mapState({
            groupIds: (state) => state.pixels.group_list,
        }),

        groupList() {
            return this.groupIds.map(gid => this.getGroup(gid));
        },
    },

    methods: {
        addCurrent() {
            if (!this.selectedGroup)
                return;

            console.log('before', this.value);
            const newSettings = addGroup(this.value, this.selectedGroup);
            console.log('after', newSettings);
            this.$emit('input', newSettings);
        },

        removeCurrent() {
            if (!this.selectedGroup)
                return;

            const newSettings = removeGroup(this.value, this.selectedGroup);
            this.$emit('input', newSettings);
        },
    }
};
</script>

<style scoped>
.flat-list {
    height: 20em;
}
</style>

