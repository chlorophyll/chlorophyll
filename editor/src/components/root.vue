<template>
    <div class="container">
      <div v-if="is_darwin" class="darwin-drag-region">
          <template v-if="has_current_model">
          <div>
              <span class="material-icons">insert_drive_file</span>
              <span>
              {{ titlebar_text }}
              </span>
          </div>
          </template>
      </div>
    <component class="main" v-bind:is="current_state" />
    </div>
</template>

<script>
import { mapState } from 'vuex';
import App from '@/components/app';
import Landing from '@/components/landing';
import store from 'chl/vue/store';

export default {
    store,
    name: 'root',
    components: { App, Landing },
    computed: {
        ...mapState([
            'has_current_model',
            'current_save_path',
        ]),
        current_state() {
            return this.has_current_model ? 'app' : 'landing';
        },
        is_darwin() {
            return process.platform === 'darwin';
        },
        titlebar_text() {
            return `${this.current_save_path} - Chlorophyll`;
        }
    }
};
</script>
<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
.darwin-drag-region {
    -webkit-app-region: drag;
    width: 100%;
    margin: 0 auto;
    white-space: nowrap;
    height: $darwin-titlebar-height;

    div {
        font-size: smaller;
        text-align: center;
        span {
            line-height: $darwin-titlebar-height;
            height: $darwin-titlebar-height;
            vertical-align: middle;
            display: inline-block;
        }
        .material-icons {
            padding-bottom: 1px;
        }
    }
}

.container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: $bg-dark;
}

.main {
    flex: auto;
}
</style>
