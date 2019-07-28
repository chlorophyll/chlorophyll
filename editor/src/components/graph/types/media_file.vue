<template>
  <div class="control-row">
    <label>{{ name }}</label>
    <div class="control tree-container">
      <div class="searchbox">
        <input type="text" v-model="query" />
        <div v-show="query !== ''" @click="clear" class="clear-icon search-icon material-icons">close</div>
        <div class="search-icon material-icons">search</div>
      </div>
      <tree ref="tree" :items="mediaFiles" class="tree " :leaf-icon="''">
        <template slot-scope="props">
          <div class="line" @click="selectItem(props.item)">
            <div class="material-icons">{{ props.leaf ? 'insert_drive_file' : 'folder'}}</div>
            <div>{{props.item.label}}</div>
          </div>
        </template>
      </tree>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex';
import { NodeConfigMixin } from 'chl/graphlib';
import Tree from '@/components/widgets/tree';
import store from 'chl/vue/store';
import isVideo from 'is-video';
import Fuse from 'fuse.js';

export default {
    store,
    name: 'graph-type-media-file',
    mixins: [NodeConfigMixin],
    components: { Tree },
    data() {
        return {
            query: '',
        };
    },
    computed: {
        ...mapGetters('media', [
            'relativePaths'
        ]),
        ...mapState('media', [
            'folder',
        ]),

        allMediaPaths() {
            const mediaPaths = this.relativePaths.filter(isVideo);
            return mediaPaths;
        },
        fuse() {
            const paths = this.allMediaPaths.map(mediaPath => {
                const components = mediaPath.split('/');
                const filename = components[components.length-1];
                return {
                    mediaPath,
                    filename,
                };
            });
            const fuse = new Fuse(paths, {
                findAllMatches: true,
                keys: ['filename'],
                id: 'mediaPath',
                shouldSort: false,
                minMatchCharLength: 1,
                threshold: 0.6,
            });
            return fuse;
        },
        mediaPaths() {
            if (this.query === '') {
                return this.allMediaPaths;
            } else {
                return this.fuse.search(this.query);
            }
        },
        mediaFiles() {
            const mediaPaths = this.mediaPaths;
            const root = {children: []};
            const initiallyOpen = this.query !== '';
            for (const mediaPath of mediaPaths) {
                const selected = mediaPath === this.value;
                let ptr = root;
                const components = mediaPath.split('/');
                const leaf = components.pop();
                for (const component of components) {
                    const idx = ptr.children.findIndex(el => el.label === component);
                    if (idx === -1) {
                        const n = { label: component, initiallyOpen, children: [] };
                        ptr.children.push(n);
                        ptr = n;
                    } else {
                        ptr = ptr.children[idx];
                    }
                    ptr.initiallyOpen = ptr.initiallyOpen || selected;
                }
                ptr.children.push({label: leaf, children: [], path: mediaPath, selected});
            }
            return root.children;
        },
    },
    mounted() {
        if (!this.value) {
            return;
        }
        this.$nextTick(() => {
            const selected = this.$el.querySelector('.selected');
            selected.scrollIntoView();
        });
    },
    methods: {
        selectItem(item) {
            this.value = item.path;
        },
        clear() {
            this.query = '';
        },
    }
}
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";

.searchbox {
  display: flex;
  align-items: center;
  padding-left: 0.5em;
  padding-right: 0.5em;
  padding-bottom: 1px;
  color: $input-text;
  background-color: $input-bg;
  border: 1px solid $input-border;
  border-radius: $control-border-radius;
  box-shadow: inset 0 1px rgba(0,0,0,0.05);

  & > input[type="text"] {
    border: none;
    box-shadow: none;
    justify-self: stretch;
    &:focus {
      background-color: $input-bg;
      outline: none;
      border: none;
      box-shadow: none;
    }
  }

  .search-icon {
    width: 1.5em;
  }

  .clear-icon {
    cursor: pointer;
  }
}

.tree-container {
  display: flex;
  flex-direction: column;
  height: 20em;

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
