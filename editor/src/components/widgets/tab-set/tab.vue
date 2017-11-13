<template>
  <div class="tab-wrapper" v-if="active">
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
.tab-wrapper {
    flex: 1;
    display: flex;
    align-items: stretch;

    & > div {
        flex: 1;
    }
}

</style>
