<template>
<div class="tab-container">
  <div class="tab-bar">
      <button v-for="tab in tabs"
          :class="{'active': current === tab}"
          @click="selectTab(tab)">
          {{ tab.title }}
      </button>
    <div class="tab-content">
        <slot />
    </div>
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

<style scoped>
.tab-container {
    background-color: #222;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.tab-bar {
  height: 4em;
}

.tab-list {
    list-style-type: none;
    border-bottom: 2px solid #666;
    margin: 0;
    padding: 0;
    padding-left: 2px;
    flex: 0 1 24px;
}

.tab-list li {
    display: inline-block;
    min-width: 50px;
    min-height: 20px;
    height: calc(100% - 2px);
    margin-right: 2px;
    margin-top: 2px;
    vertical-align: top;
    padding: 4px 8px 2px 4px;
    border-radius: 3px 3px 0 0;
}

.tab-list li.active {
    color: #eee;
    background-color: #777;
    border-bottom: 0;
}

.tab-list li:hover:not(.active) {
    background-color: #555;
    color: #ddd;
}

.tab-content {
    flex: 1 1 auto;
    display: flex;
}

</style>
