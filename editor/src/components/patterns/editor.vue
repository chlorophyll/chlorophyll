<template>
    <split-pane direction="horizontal"
                :initial-split="[null, Const.sidebar_size]">
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
                    <label for="preview-map-list">Preview map</label>
                    <span class="inputcombo">
                        <select class="control" id="preview-map-list"
                                                v-model="preview_map_id">
                            <template v-for="mapping in mappings">
                                <option :value="mapping.id">{{ mapping.name }}</option>
                            </template>
                        </select>
                    </span>
                    <button @click="autolayout">Autolayout</button>
                    <button @click="resetZoom">Reset zoom</button>
                    <button @click="zoomToFit">Zoom to fit</button>
                </div>
            </div>
            <div class="panel" id="mainview">
                <split-pane direction="horizontal" :initial-split="[210, null]">
                    <div slot="first" class="node-browser">
                        <tree :items="node_list" class="tree">
                        <template scope="props">
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
                             :runstate="runstate" />
        </div>
        <pattern-list slot="second" />
    </split-pane>
</template>
<script>
import { ConstMixin } from 'chl/const';
import { mapGetters } from 'vuex';
import { mappingUtilsMixin } from 'chl/mapping';
import PatternList from '@/components/patterns/list';
import SplitPane from '@/components/widgets/split';
import Tree from '@/components/widgets/tree';
import GraphCanvas from '@/components/graphcanvas';
import register_nodes from '@/common/nodes/registry';
import { RunState, PatternPreview } from 'chl/patterns';
import GraphLib from '@/common/graphlib';
import store from 'chl/vue/store';

function getNodeList() {
    register_nodes();
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
    components: {Tree, GraphCanvas, SplitPane, PatternPreview, PatternList},
    mixins: [ConstMixin, mappingUtilsMixin],
    computed: {
        run_text() {
            let running = (this.runstate == RunState.Running);
            return running ? 'pause' : 'play_arrow';
        },
        can_preview() {
            return this.preview_mapping !== null && this.cur_pattern !== null;
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
        mappings() {
            if (this.cur_pattern === null)
                return [];

            const type = this.cur_pattern.mapping_type;

            return this.mapping_list.filter((map) => type == map.type);
        },
        preview_mapping() {
            return this.preview_map_id !== null ? this.getMapping(this.preview_map_id) : null;
        }
    },
    data() {
        return {
            time: 0,
            preview_map_id: null,
            runstate: RunState.Stopped,
            node_list: getNodeList(),
        };
    },

    watch: {
        mappings(newval) {
            if (newval.length == 1)
                this.preview_map_id = newval[0].id;
        },
        cur_pattern(newval, oldval) {
            if (!newval || !oldval || newval.id != oldval.id)
                this.runstate = RunState.Stopped;
        },
    },

    methods: {
        toggleAnimation() {
            if (this.runstate == RunState.Running) {
                this.runstate = RunState.Paused;
            } else {
                this.runstate = RunState.Running;
            }
        },
        stopAnimation() {
            this.runstate = RunState.Stopped;
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
        }
    }
};
</script>
<style scoped>
#pattern-composer {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    height: 100%;
    width: 100%;
    position: relative;
    user-select: none;
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

.item {
    cursor: pointer;
    padding: 0;
    margin: 0;
}

.node-browser {
    height: 100%;
    display: flex;
}

.node-browser .tree {
    flex: 1;
}
</style>
