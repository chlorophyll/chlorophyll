<template>
    <div class="root">
    <div class="topwidgets">
        <button
         @click="toggleAnimation"
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
        <select id="preview-map-list">
            <template v-for="mapping in mappings">
                <option :value="mapping.id">{{ mapping.name }}</option>
            </template>
        </select>
        </span>
    </div>
    <split-pane class="mainview" direction="horizontal" :initial-split="[210, null]">
        <tree slot="first" :items="nodeList">
        <template scope="props">
            <div class="item"
                draggable="true"
                v-if="props.leaf"
                @dragstart="dragNode(props.item)">
                {{ props.item.label }}
            </div>
            <div v-else class="item">
                {{ props.item.label }}
            </div>
        </template>
        </tree>
        <graph-canvas slot="second" :graph="cur_graph"/>
    </split-pane>
    </div>
</template>
<script>
import { mapGetters } from 'vuex';
import SplitPane from '@/components/widgets/split';
import Tree from '@/components/widgets/tree';
import GraphCanvas from '@/components/graphcanvas';
import register_nodes from 'chl/patterns/registry';
import GraphLib from 'chl/graphlib/graph';
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
    components: {Tree, GraphCanvas, SplitPane},
    computed: {
        run_text() {
            return this.running ? 'pause' : 'play_arrow';
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
        }
    },
    data() {
        return {
            running: false,
            previewMap: null,
            nodeList: getNodeList(),
        };
    },
    methods: {
        toggleAnimation() {
            this.running = !this.running;
        },
        stopAnimation() {
            this.running = false;
        },
        dragNode(node) {
            console.log(node);
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
