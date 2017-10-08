<template>
  <div class="tab-container" v-bind:class="{'active': active}">
    <slot></slot>
  </div>
</template>

<script>
export default {
    name: 'tab',
    data() {
        return {
            active: false,
        };
    },
    props: {
        title: {
            required: true,
            type: String,
        },
        isActive: {
            required: false,
            type: Boolean,
            default: false,
        }
    },

    methods: {
        removeTab() {
            this.$destroy();
        },
    },
    created() {
        this.active = this.isActive;
    },
    mounted() {
        this.$parent.addTab(this);
    }
};
</script>
<style scoped lang="scss">
div {
  display: none;
  width: 100%;
  height: 100%;

  &.active {
    display: block;
  }
}

</style>
