<template>
    <div class="root">
    <div class="topwidgets">
        <button
         @click="toggleAnimation"
         :disabled="!can_preview"
         class="iconbutton litebutton material-icons">
            {{ run_text }}
        </button>
        <button
         @click="stopAnimation"
         class="iconbutton litebutton material-icons">
            stop
        </button>
        <label for="preview-map-list">Preview map</label>
        <span class="inputcombo">
        <select id="preview-map-list" v-model="preview_map_id">
            <template v-for="mapping in mappings">
                <option :value="mapping.id">{{ mapping.name }}</option>
            </template>
        </select>
        </span>
        <button @click="autolayout">Autolayout</button>
        <button @click="resetZoom">Reset zoom</button>
        <button @click="zoomToFit">Zoom to fit</button>
    </div>
    <split-pane class="mainview" direction="horizontal" :initial-split="[210, null]">
        <tree slot="first" :items="node_list">
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
        <graph-canvas ref="canvas" slot="second" :graph="cur_graph"/>
    </split-pane>
    <pattern-preview v-if="can_preview"
                     :pattern="cur_pattern"
                     :mapping="preview_mapping"
                     :runstate="runstate" />
    </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { mappingUtilsMixin } from 'chl/mapping';
import SplitPane from '@/components/widgets/split';
import Tree from '@/components/widgets/tree';
import GraphCanvas from '@/components/graphcanvas';
import register_nodes from '@/common/nodes/registry';
import { RunState, PatternPreview } from 'chl/patterns';
import GraphLib from 'chl/graphlib';
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
    components: {Tree, GraphCanvas, SplitPane, PatternPreview},
    mixins: [mappingUtilsMixin],
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
.root {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    user-select: none;
}
.mainview {
    flex: 1 1 auto;
}
.topwidgets {
    flex: 0 1 auto;
    padding-top: 4px;
    padding-bottom: 4px;
}
.iconbutton {
    width: 30px;
}
.inputcombo {
	border-bottom: 1px solid #666;
	border-top: 1px solid #111;
	border-radius: 4px;
    display: inline-block;
}
.inputcombo select {
    background-color: #222;
    border: 0;
    color: #5af;
    width: 10em;
}
.item {
    cursor: pointer;
    padding: 0;
    margin: 0;
}
</style>
