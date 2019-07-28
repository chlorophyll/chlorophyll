<template>
    <split-pane direction="horizontal"
                :initial-split="[null, Const.sidebar_size]" style="height: 100%">
        <div id="pattern-composer" slot="first">
            <div class="panel inline" id="top-controls">
                <div class="control-row">
                    <button @click="toggleAnimation"
                     :disabled="!can_preview"
                     class="square highlighted material-icons">
                        {{ run_text }}
                    </button>
                    <button @click="stopAnimation"
                     class="square material-icons">
                        stop
                    </button>
                    <label for="push-to-hardware">Push to hardware</label>
                    <toggle v-model="pushToHardware" class="toggle" />
                    <label for="preview-map-list">Preview map</label>
                    <select class="control" id="preview-map-list"
                                            v-model="preview_map_id">
                        <template v-for="mapping in mappings">
                            <option :value="mapping.id">{{ mapping.name }}</option>
                        </template>
                    </select>
                    <label for="preview-group-list">Preview group</label>
                    <select class="control" id="preview-group-list"
                                            v-model="preview_group_id">
                        <template v-for="group in group_list">
                            <option :value="group.id">{{ group.name }}</option>
                        </template>
                    </select>
                    <button @click="autolayout">Autolayout</button>
                    <button @click="resetZoom">Reset</button>
                    <button @click="zoomToFit">Zoom to fit</button>
                    <span class="cur-fps" v-if="curFpsSample !== null">FPS: {{curFpsSample}}</span>
                    <sparkline class="fps-graph" :width="100" :height="14" :samples="fpsSamples" />
                </div>
            </div>
            <div class="panel" id="mainview">
                <split-pane direction="horizontal" :initial-split="[210, null]">
                    <div slot="first" class="node-browser">
                      <div class="searchbox">
                        <input type="text" v-model="query" />
                        <div v-show="query !== ''" @click="query=''" class="clear-icon search-icon material-icons">close</div>
                        <div class="search-icon material-icons">search</div>
                      </div>
                        <tree :items="nodeTree" class="tree">
                        <template slot-scope="props">
                            <div class="item"
                                 draggable="true"
                                 v-if="props.leaf"
                                 @dragstart="dragNode(props.item, $event)">
                                {{ props.item.label }}
                            </div>
                            <div v-else class="item">
                                {{ props.item.label }}
                            </div>
                        </template>
                        </tree>
                    </div>
                    <graph-canvas ref="canvas" slot="second" :graph="cur_graph"/>
                </split-pane>
            </div>
            <pattern-preview v-if="can_preview"
                             :pattern="cur_pattern"
                             :mapping="preview_mapping"
                             :group="preview_group"
                             :push-to-hardware="pushToHardware"
                             :runstate="runstate"
                             :hardware-settings="activeHardwareSettings"
                             :hardware-protocol="activeProtocol"
                             @fps-sample-updated="pushFpsSample"
                             />
        </div>
        <pattern-list slot="second" @pattern-dblclick="onPatternDblClick"/>
    </split-pane>
</template>
<script>
import Fuse from 'fuse.js';
import Const, { ConstMixin } from 'chl/const';
import { mapGetters } from 'vuex';
import { mappingUtilsMixin } from 'chl/mapping';
import PatternList from '@/components/patterns/list';
import Toggle from '@/components/widgets/toggle';
import SplitPane from '@/components/widgets/split';
import Tree from '@/components/widgets/tree';
import GraphCanvas from '@/components/graph/graphcanvas';
import Sparkline from '@/components/widgets/sparkline';
import * as nodeRegistry from '@/common/nodes/registry';
import { RunState, PatternPreview } from 'chl/patterns/preview';
import GraphLib from '@/common/graphlib';
import store from 'chl/vue/store';
import * as numeral from 'numeral';

function getNodeList(store) {
    nodeRegistry.refreshFromStore(store);
    let node_types = GraphLib.getNodeTypes();
    let root = {children: []};
    node_types.forEach(function(node_type, path) {
        let ptr = root;
        let components = path.split('/');
        let leaf = components.pop();
        components.forEach(function(component) {
            let idx = ptr.children.findIndex((el) => el.label == component);
            if (idx == -1) {
                let n = {label: component, children: []};
                ptr.children.push(n);
                ptr = n;
            } else {
                ptr = ptr.children[idx];
            }
        });
        ptr.children.push({label: leaf, children: [], path: path});
    });
    return root.children;
}


export default {
    store,
    components: {Tree, GraphCanvas, SplitPane, PatternPreview, PatternList, Toggle, Sparkline},
    mixins: [ConstMixin, mappingUtilsMixin],
    computed: {
        allNodePaths() {
            // TODO(rpearl) understand why the node list is maintained in this way??
            nodeRegistry.refreshFromStore(store);
            const nodeTypes = GraphLib.getNodeTypes();
            return [...nodeTypes.keys()];
        },
        fuse() {
            const nodePaths = this.allNodePaths.map(nodePath => {
                const components = nodePath.split('/');
                const leaf = components[components.length-1];
                return {
                    leaf,
                    nodePath,
                };
            });

            const fuse = new Fuse(nodePaths, {
                keys: ['leaf'],
                id: 'nodePath',
                shouldSort: true,
                minMatchCharLength: 2,
                threshold: 0.3,
            });
            return fuse;
        },
        visibleNodePaths() {
            if (this.query === '') {
                return this.allNodePaths;
            } else {
                return this.fuse.search(this.query);
            }
        },
        nodeTree() {
            let root = {children: []};
            const initiallyOpen = this.query !== '';
            for (const path of this.visibleNodePaths) {
                let ptr = root;
                const components = path.split('/');
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
                }
                ptr.children.push({label: leaf, children: [], path});
            }
            return root.children;
        },
        run_text() {
            let running = (this.runstate == RunState.Running);
            return running ? 'pause' : 'play_arrow';
        },
        can_preview() {
            const conditions = [this.preview_mapping, this.cur_pattern, this.preview_group];
            return conditions.every((c) => c !== null);
        },
        cur_graph() {
            if (this.cur_pattern === null)
                return null;
            return GraphLib.graphById(this.cur_pattern.stages.pixel);
        },
        ...mapGetters('pattern', [
            'cur_pattern',
        ]),
        ...mapGetters('mapping', [
            'mapping_list',
        ]),
        ...mapGetters('pixels', [
            'group_list',
        ]),
        ...mapGetters('hardware', [
            'activeProtocol',
            'activeHardwareSettings',
        ]),
        mappings() {
            if (this.cur_pattern === null)
                return [];

            const type = this.cur_pattern.mapping_type;

            return this.mapping_list.filter((map) => type == map.type);
        },
        preview_mapping() {
            return this.preview_map_id !== null ? this.getMapping(this.preview_map_id) : null;
        },
        preview_group() {
            return this.preview_group_id !== null ? this.getGroup(this.preview_group_id) : null;
        },
        curFpsSample() {
            const last = this.fpsSamples[this.fpsSamples.length-1];
            if (last !== 0) {
                return Math.ceil(last);
            } else {
                return null;
            }
        },
    },
    data() {
        return {
            fpsSamples: new Array(Const.num_fps_samples).fill(0),
            preview_map_id: null,
            preview_group_id: this.$store.state.pixels.group_list[0],
            pushToHardware: false,
            runstate: RunState.Stopped,
            node_list: getNodeList(this.$store),
            query: '',
        };
    },
    watch: {
        mappings(newval) {
            if (newval.length == 1)
                this.preview_map_id = newval[0].id;
        },
        groups(newval) {
            if (newval.length == 1)
                this.preview_group_id = newval[0].id;
        },
        cur_pattern(newval, oldval) {
            if (newval && oldval && newval.id != oldval.id && this.runstate == RunState.Paused) {
                this.runstate = RunState.Stopped;
            }
        },
    },

    methods: {
        pushFpsSample(sample) {
            this.fpsSamples.shift();
            this.fpsSamples.push(sample);
        },
        toggleAnimation() {
            if (this.runstate == RunState.Running) {
                this.runstate = RunState.Paused;
            } else {
                this.runstate = RunState.Running;
            }
        },
        stopAnimation() {
            this.runstate = RunState.Stopped;
            this.fpsSamples = new Array(Const.num_fps_samples).fill(0);
        },
        dragNode(item, event) {
            event.dataTransfer.setData('text/plain', item.path);
            event.dataTransfer.dragEffect = 'link';
        },
        autolayout() {
            this.$refs.canvas.autolayout();
        },
        resetZoom() {
            this.$refs.canvas.resetZoom();
        },
        zoomToFit() {
            this.$refs.canvas.zoomToFit();
        },
        onPatternDblClick(pattern) {
            this.toggleAnimation();
        },
    }
};
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
#pattern-composer {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    height: 100%;
    width: 100%;
    position: relative;
    user-select: none;
}

label, .fps-graph, .cur-fps {
    display: inline-block;
    vertical-align: middle;
    padding-top: 5px;
}

.fps-graph {
    padding-bottom: 5px;
}

.cur-fps {
    padding-left: 5px;
}


#top-controls {
    flex: initial;
}

#mainview {
    flex: auto;
    display: block;
    position: relative;
    height: 100%;
}

#preview-group-list {
    max-width: 10em;
}

.item {
    cursor: pointer;
    padding: 0;
    margin: 0;
}

.node-browser {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.node-browser .tree {
    flex: 1;
}

.toggle {
    margin-top: 3px;
    vertical-align: middle;
}
</style>
