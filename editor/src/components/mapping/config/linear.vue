<template>
<div class="panel">

  <div class="flat-list">
    <ul>
      <li v-for="pixelIdx in value.pixelIds">
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
import store from 'chl/vue/store';
import { mapState } from 'vuex';
import { mappingUtilsMixin } from 'chl/mapping';
import LinearMapping from '@/common/mapping/linear';

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

    mounted() {
        this.mapping = new LinearMapping(this.value);
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

            this.mapping.addGroup(this.selectedGroup);
            this.$emit('input', this.mapping.serialize());
        },

        removeCurrent() {
            if (!this.selectedGroup)
                return;

            this.mapping.removeGroup(this.selectedGroup);
            this.$emit('input', this.mapping.serialize());
        },
    }
};
</script>

<style scoped>
.flat-list {
    height: 20em;
}
</style>

