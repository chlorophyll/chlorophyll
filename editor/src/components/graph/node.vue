<template>
    <g class="node"
       :class="{connecting: curSrc !== null, replace}"
       :transform="position" @click="onClick" @dblclick="onDblClick">
        <g>
        <!-- full outline -->
        <rect
            x="0"
            y="0"
            :width="width"
            :height="height"
            :stroke="node.config.color"
            class="outline" />
        <!-- main box -->
        <rect x="0"
              class="mainbox"
              :y="tHeight"
              :width="width"
              :height="height-tHeight"
              :stroke="node.config.color"
              :fill="node.config.bgcolor"
              @dragenter="dragEnter"
              @drop="drop"
              @dragleave="dragExit"
              />
        <!-- titlebar -->
        <rect x="0"
              y="0"
              class="titlebar"
              :width="width"
              :height="tHeight"
              :stroke="node.config.color"
              :fill="node.config.color"
              @mousedown.stop="startDrag"
              />
        <!-- title box -->
        <rect x="3"
              y="3"
              :width="tHeight - 6"
              :height="tHeight - 6"
              class="titlebox"
              :fill="node.config.boxcolor"
              @click="togglePicker"
              />

        <!-- closebox -->
        <g v-if="node.config.removable"
           class="clickable"
           :transform="`translate(${this.width-tHeight+4},4)`"
           @click="$emit('remove-clicked', node)">

        <rect x="0"
              y="0"
              :width="tHeight-4"
              :height="tHeight-4"
              :fill="node.config.color" />
        <line x1="0"
              y1="0"
              :x2="tHeight-8"
              :y2="tHeight-8"
              stroke-width="2"
              :stroke="node.config.bgcolor" />
        <line x1="0"
              :y1="tHeight-8"
              :x2="tHeight-8"
              y2="0"
              stroke-width="2"
              :stroke="node.config.bgcolor" />
        </g>
        <!-- input ports -->
        <template v-for="(input, slot) in node.inputs">
            <g :class="[fill_class.inputs[slot]]" class="input-target"
               @mouseenter="mouseEnter" @mouseleave="mouseLeave"
               v-if='!input.settings.read_only'
            >
            <circle :cx="node.connectionX(slot, true)"
                    :cy="node.connectionY(slot, true)"
                    r="4"
                    class="input port"
                    stroke="black" />
            <circle :cx="node.connectionX(slot, true)"
                    :cy="node.connectionY(slot, true)"
                    r="8"
                    fill="transparent"
                    class="clickable"
                    @mouseenter="$emit('dst-hover-start', node, slot)"
                    @mouseleave="$emit('dst-hover-end', node, slot)"
                    @click="$emit('dst-selected', node, slot)"
                    />
            </g>
        </template>
        <template v-for="(output, slot) in node.outputs">
            <g :class="[fill_class.outputs[slot]]" class="output-target">
            <circle :cx="node.connectionX(slot, false)"
                    :cy="node.connectionY(slot, false)"
                    r="4"
                    class="output port"
                    stroke="black" />
            <circle :cx="node.connectionX(slot, false)"
                    :cy="node.connectionY(slot, false)"
                    r="8"
                    class="clickable"
                    fill="transparent"
                    @mousedown.capture.stop="$emit('src-selected', node, slot)"
                    />
            </g>
        </template>
        </g>

        <g>
        <!-- title text -->
        <text x="16" :y="12" class="title-text" fill="black">
        {{ node.title }}
        </text>
        <!-- input text -->
        <template v-for="(input, slot) in node.inputs">
            <text :x="node.connectionX(slot, true)+10"
                  :y="node.connectionY(slot, false)"
                  dy="0.3em"
                  :fill="node.config.color">
            {{ node.slot_labels.inputs[slot] }}
            </text>
        </template>
        <!-- output text -->
        <template v-for="(output, slot) in node.outputs">
            <text :x="node.connectionX(slot, false)-10"
                  :y="node.connectionY(slot, false)"
                  dy="0.3em"
                  :fill="node.config.color"
                  text-anchor="end">
            {{ node.slot_labels.outputs[slot] }}
            </text>
        </template>
        </g>
        <g :transform="swatchTransform" v-if="showPicker">
            <foreignObject x="0" y="0" :width="pickerWidth" :height="pickerHeight">
                <swatches
                    :background-color="node.config.bgcolor"
                    v-model="color"
                    inline
                    :colors="colors"
                    :swatch-size="swatchSize"
                    :swatch-style="{padding: '1px', margin: '1px'}"
                    :wrapper-style="pickerWrapperStyle"
                />
            </foreignObject>
        </g>
    </g>
</template>

<script>
import { GraphConstants } from 'chl/graphlib';
import GraphLib from '@/common/graphlib';
import tinycolor from 'tinycolor2';
import Swatches from 'vue-swatches'

export default {
    name: 'graph-node',
    props: ['node', 'curSrc', 'curHighlight'],
    components: {Swatches},
    data() {
        return {
            dragstart: null,
            replace: false,
            showPicker: false,
        };
    },
    watch: {
        curHighlight() {
            if (this.curHighlight !== this.node.id) {
                console.log('curHighlight');
                this.showPicker = false;
            }
        },
    },
    computed: {
        color: {
            get() {
                return tinycolor(this.node.config.color).toHexString();
            },
            set(val) {
                this.node.config.color = val;
                let boxcolor = '#aef';
                if (val !== '#999999') {
                    boxcolor = tinycolor(val).lighten(20).toHexString();
                }
                this.node.config.boxcolor = boxcolor;
            },
        },
        colors() {
            return [
                "#FFB7A5", "#E9947D", "#D17257",
                "#FFB3D0", "#EB91AF", "#D56F90",
                "#E1BAE1", "#BF93BE", "#9D6D9C",
                "#D6CCFF", "#B7A8E8", "#9784D2",
                "#B3CFFF", "#91ACE5", "#6F8ACB",
                "#97F3EB", "#78D5CC", "#58B8AE",
                "#B1ECB5", "#8DCD8F", "#6AAE6A",
                "#E8F9B6", "#CADD91", "#ADC16D",
                '#999999',
            ];
        },
        pickerWrapperStyle() {
            return {
                width: `${this.pickerWidth}px`,
                height: `${this.pickerHeight}px`,
                border: '1px solid #999',
            };
        },

        swatchSize() {
            return 16;
        },
        swatchPadding() {
            return 2;
        },
        pickerHeight() {
            return (this.swatchSize + this.swatchPadding) * 3 + 12 + 8;
        },
        pickerWidth() {
            return (this.swatchSize + this.swatchPadding) * 9 + 12;
        },

        swatchTransform() {
            return `translate(0, -${this.pickerHeight+4})`;
        },
        width() {
            return this.node.width;
        },
        height() {
            return this.node.height;
        },
        tHeight() {
            return GraphConstants.NODE_TITLE_HEIGHT;
        },
        position() {
            return `translate(${this.node.pos[0]}, ${this.node.pos[1]})`;
        },

        fill_class() {
            const cls = ({state}) => state.num_edges > 0 ? 'connected' : 'unconnected';
            const inputs = this.node.inputs.map(cls);
            const outputs = this.node.outputs.map(cls);

            if (this.curSrc !== null && this.curSrc.node == this.node) {
                outputs[this.curSrc.slot] = 'cur-src';
            }

            return {inputs, outputs};
        },
    },
    methods: {
        startDrag(event) {
            const {x, y} = this.$parent.coords(event.pageX, event.pageY);

            this.dragstart = {
                x,
                y,
                pos: this.node.pos.concat(),
            };

            this.$parent.$el.addEventListener('mousemove', this.drag);
            this.$parent.$el.addEventListener('mouseup', this.endDrag);
        },

        drag(event) {
            const {x, y} = this.$parent.coords(event.pageX, event.pageY);

            const dX = x - this.dragstart.x;
            const dY = y - this.dragstart.y;

            this.$set(this.node.pos, 0, this.dragstart.pos[0] + dX);
            this.$set(this.node.pos, 1, this.dragstart.pos[1] + dY);
        },

        endDrag(event) {
            this.dragstart = null;
            this.$parent.$el.removeEventListener('mousemove', this.drag);
            this.$parent.$el.removeEventListener('mouseup', this.endDrag);
        },

        dstSelected(slot) {
            this.$emit('output-selected', this.node, slot);
        },

        mouseEnter(event) {
            event.target.classList.add('hover');
        },
        mouseLeave(event) {
            event.target.classList.remove('hover');
        },
        onDblClick() {
            this.$emit('node-dblclicked', this.node);
        },
        onClick() {
            this.$emit('node-clicked', this.node);
        },
        dragEnter(event) {
            const replacementPath = this.$parent.dragPath;
            const graphNode = this.node.graph_node;
            const path = graphNode.path;
            if (
                path === replacementPath ||
                !GraphLib.areNodeTypesCompatible(path, replacementPath)
            ) {
                return;
            }
            this.interval = setTimeout(() => {
                this.replace = true;
                this.interval = null;
            }, 200);
            event.preventDefault();
        },

        endReplace() {
            this.replace = false;
            if (this.interval) {
                clearInterval(this.interval);
                this.interval = null;
            }
        },

        dragExit(event) {
            this.endReplace();
        },
        drop(event) {
            if (this.replace) {
                event.stopPropagation();
                const graphNode = this.node.graph_node;
                const graph = graphNode.graph;
                const path = event.dataTransfer.getData('text');
                graph.replaceNode(graphNode, path);
            }
            this.endReplace();
        },
        togglePicker() {
            this.showPicker = !this.showPicker;
        }
    }
};
</script>

<style scoped>
.node {
    user-select: none;
}
@keyframes pulse {
    0% {
        stroke-width: 2;
        stroke-opacity: 100%;
    }

    100% {
        stroke-width: 25;
        stroke-opacity: 0.01;
    }
}

.replace .outline{
    animation: pulse 1s infinite;
}

.titlebar {
    cursor: move;
}

text {
    font-family: Arial;
    font-size: 10px;
}

.title-text {
    font-size: 11px;
    font-weight: bold;
    pointer-events: none;
}

.clickable {
    cursor: pointer;
}

.connected .port {
    fill: #7f7;
}

.unconnected .port {
    fill: #aaa;
}

.connecting .cur-src .port {
    fill: #e8ff75;
}

.connecting .input-target.hover circle.port {
    fill: #e8ff75 !important;
}

</style>
