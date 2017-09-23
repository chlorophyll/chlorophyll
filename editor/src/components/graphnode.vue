<template>
    <g class="node" :class="{connecting: curSrc !== null}" :transform="position" @mousedown.stop="startDrag">
        <g>
        <!-- main box -->
        <rect x="0"
              y="0"
              :width="width"
              :height="height"
              :stroke="node.config.color"
              :fill="node.config.bgcolor" />
        <!-- titlebar -->
        <rect x="0"
              :y="-tHeight"
              :width="width"
              :height="tHeight"
              :stroke="node.config.color"
              :fill="node.config.color" />
        <!-- title box -->
        <rect x="3"
              :y="-tHeight + 3"
              :width="tHeight - 6"
              :height="tHeight - 6"
              :fill="node.config.boxcolor" />

        <!-- closebox -->
        <g v-if="node.config.removable"
           class="clickable"
           :transform="`translate(${this.width-tHeight+4},${-tHeight+4})`"
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
        <text x="16" :y="12-tHeight" class="title-text" fill="black">
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
    </g>
</template>

<script>
import Const from 'chl/const';

export default {
    name: 'graph-node',
    props: ['node', 'curSrc'],
    data() {
        return {
            dragstart: null,
        };
    },
    computed: {
        width() {
            return this.node.width;
        },
        height() {
            return this.node.height;
        },
        tHeight() {
            return Const.Graph.NODE_TITLE_HEIGHT;
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
            this.$emit('output-selected', this, slot);
        },

        mouseEnter(event) {
            event.target.classList.add('hover');
        },
        mouseLeave(event) {
            event.target.classList.remove('hover');
        }


    }
};
</script>

<style scoped>
.node {
    cursor: move;
}

text {
    font-family: Arial;
    font-size: 10px;
}

.title-text {
    font-size: 11px;
    font-weight: bold;
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
