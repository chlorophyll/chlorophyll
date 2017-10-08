<template>
<div class="tab-container">
  <div class="tab-bar">
    <div v-for="tab in tabs" class="tab-button-container">
      <button :class="{'active': current === tab}"
              @click="selectTab(tab)">
          {{ tab.title }}
      </button>
    </div>
  </div>
  <div class="tab-content">
      <slot />
  </div>
</div>
</template>
<script>
import Tab from '@/components/widgets/tab-set/tab';

export default {
    name: 'tab-set',
    data() {
        return {
            tabs: [],
            current: null,
        };
    },
    components: { Tab },

    methods: {
        selectTab(tab) {
            this.current = tab;
            this.tabs.forEach(function(child) { child.active = (child === tab); });
        },
        addTab(tab) {
            this.tabs.push(tab);
            if (tab.active == true || !this.current) {
                this.selectTab(tab);
            }
        },
        removeTab(tab) {
            const index = this.tabs.indexOf(tab);
            this.tabs.splice(index, 1);
            this.$el.removeChild(tab.$el);
            tab.removeTab();
            let next = this.tabs.length > 0 ? this.tabs[0] : null;
            this.selectTab(next);
        }
    }
};
</script>

<style lang="scss">
.tab-container {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  height: 100%;
  width: 100%;
}

.tab-content {
  /* 
   * NOTE: webkit requires width, flex-grow, and flex-basis to be specified
   * in order for percentage-height to work on children
   */
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: fill;
  position: relative;
  height: 100%;
}

.tab-bar {
  flex: initial;
  height: 1.5em;
  
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: flex-start;
}

.tab-button-container {
  flex: auto;

  button {
    height: 100%;
    width: 100%;
  }
}

</style>
