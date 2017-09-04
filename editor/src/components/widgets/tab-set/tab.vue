<template>
  <div v-bind:class="{'active': active}">
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
<style scoped>
div {
    display: none;
    background-color: #333;
    padding-left: 2px;
    padding-right: 2px;
    flex: 1 1 auto;
}

div.active {
    display: block;
}

</style>
