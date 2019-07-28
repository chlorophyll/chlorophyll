<template>
  <div class="control-row">
    <label>{{ name }}</label>
    <tree :items="mediaFiles" class="tree control" :leaf-icon="''">
      <template slot-scope="props">
        <div class="line" @click="selectItem(props.item)">
          <div class="material-icons">{{ props.leaf ? 'insert_drive_file' : 'folder'}}</div>
          <div>{{props.item.label}}</div>
        </div>
      </template>
    </tree>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { NodeConfigMixin } from 'chl/graphlib';
import Tree from '@/components/widgets/tree';
import store from 'chl/vue/store';
import isVideo from 'is-video';

export default {
    store,
    name: 'graph-type-media-file',
    mixins: [NodeConfigMixin],
    components: { Tree },
    computed: {
        ...mapGetters('media', [
            'relativePaths'
        ]),
        ...mapState('media', [
            'folder',
        ]),
        mediaFiles() {
            const mediaPaths = this.relativePaths.filter(isVideo);
            const root = {children: []};
            for (const mediaPath of mediaPaths) {
                let ptr = root;
                const components = mediaPath.split('/');
                const leaf = components.pop();
                for (const component of components) {
                    const idx = ptr.children.findIndex(el => el.label === component);
                    if (idx === -1) {
                        const n = {label: component, children: []};
                        ptr.children.push(n);
                        ptr = n;
                    } else {
                        ptr = ptr.children[idx];
                    }
                }
                const selected = mediaPath === this.value;
                ptr.children.push({label: leaf, children: [], path: mediaPath, selected});
            }
            return root.children;
        },
    },
    methods: {
        selectItem(item) {
            this.value = item.path;
        },
    }
}
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
.tree {
  height: 9.5em;

  & >> ul {
    width: 100%;
    .selected {
      background-color: $accent;
      color: $accent-text;
    }
  }

  .icon {
    color: $base-grey;
  }
  .line {
    display: flex;
    align-items: center;
    white-space: nowrap;

    .material-icons {
      flex: 0;
      width: 1.2em;
    }


  }
}
</style>
