<template>
    <g :transform="transform" v-if="width > 0">
        <rect
            x="0"
            y="0"
            :width="width"
            :height="height"
            ry="4"
            class="clip"
            :class="{selected}"
            />
        <foreignObject x="10" :y="0" :width="width-20" :height="height">
          <div class="clip-container">
            <div class="pattern-name">{{ clip.pattern.name }}</div>
            <div class="edit material-icons" @click.stop="onEditClick">edit</div>
          </div>
        </foreignObject>

        <rect
            x="0"
            y="0"
            width="10"
            :height="height"
            class="drag-handle"
            @mousedown.stop="beginDrag(DragType.Start, $event)"/>
        <rect
            x="10"
            y="0"
            :width="width-36"
            :height="height"
            class="pattern"
            @mousedown.stop="beginDrag(DragType.Move, $event)" />
        <rect
            :x="width-10"
            y="0"
            width="10"
            :height="height"
            class="drag-handle"
            @mousedown.stop="beginDrag(DragType.End, $event)"/>
    </g>
</template>
<script>
import _ from 'lodash';
import Util from 'chl/util';
import Const, { ConstMixin } from 'chl/const';
import store from 'chl/vue/store';
import { mappingUtilsMixin } from 'chl/mapping';
import { mapGetters } from 'vuex';
import * as numeral from 'numeral';
const DragType = {
    Start: 1,
    End: 2,
    Move: 3,
};

export default {
    name: 'clip',
    store,
    mixins: [ConstMixin, mappingUtilsMixin],
    props: ['clip', 'preview', 'scale', 'curDragLayerId', 'layerOffset', 'selected'],
    data() {
        return {
            dragInfo: null,
            editing: false,
        }
    },
    watch: {
    },
    computed: {
        ...mapGetters('pixels', [
            'group_list',
        ]),
        DragType() {
            return DragType;
        },
        startTime() {
            return this.dragInfo ? this.dragInfo.startTime : this.clip.startTime;
        },
        endTime() {
            return this.dragInfo ? this.dragInfo.endTime : this.clip.endTime;
        },
        transform() {
            const x = this.scale(this.startTime);
            const y = this.layerOffset + Const.timeline_track_padding;
            return `translate(${x}, ${y})`;
        },
        maxTextWidth() {
            return this.width - 40;
        },
        width() {
            return this.scale(this.endTime) - this.scale(this.startTime);
        },
        height() {
            return Const.timeline_track_height - 2*Const.timeline_track_padding;
        },
    },
    beforeDestroy() {
    },
    methods: {
        onEditClick() {
            this.$emit('select-clip', this.clip);
        },
        beginDrag(type, event) {
            if (this.preview) {
                return;
            }
            const {x, y} = this.$parent.coords(event.pageX, event.pageY);
            this.dragInfo = {
                x,
                y,
                type,
                initialStart: this.clip.startTime,
                initialEnd: this.clip.endTime,
                startTime: this.clip.startTime,
                endTime: this.clip.endTime,
            };
            window.addEventListener('mousemove', this.drag);
            window.addEventListener('mouseup', this.endDrag);
        },
        drag(event) {
            const {x, y} = this.$parent.coords(event.pageX, event.pageY);
            const dX = x - this.dragInfo.x;
            const dY = y - this.dragInfo.y;

            const dTime = this.scale.invert(dX);

            const {type, initialStart, initialEnd} = this.dragInfo;

            if (_.includes([DragType.Start, DragType.Move], type)) {
                this.dragInfo.startTime = initialStart + dTime;
            }

            if (_.includes([DragType.End, DragType.Move], type)) {
                this.dragInfo.endTime = initialEnd + dTime;
            }

            if (type === DragType.Move && this.clip.layerId !== this.curDragLayerId) {
                this.$emit('change-layer', this.clip, this.curDragLayerId);
            }

        },

        endDrag(event) {
            this.$emit('end-drag', this.clip, this.dragInfo.startTime, this.dragInfo.endTime);
            this.dragInfo = null;
            window.removeEventListener('mousemove', this.drag);
            window.removeEventListener('mouseup', this.endDrag);
        }
    },
};
</script>
<style scoped lang="scss">
@import './src/style/aesthetic.scss';

.drag-handle {
    cursor: col-resize;
    fill: none;
}


.pattern {
    cursor: move;
    fill: none;
}

.clip {
    fill: $control-highlight;
    stroke: $control-highlight-border;

    &.selected {
      fill: $base-green-3;
      stroke: $base-green-1;
    }
}

.mapping {
    margin-right: 2em;
}

.clip-container {
    display: flex;
    align-items: center;
    height: 100%;
    color: $accent-text;
}

.pattern-name {
    flex: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}

.edit {
    width: 1em;
    cursor: pointer;
}
</style>

<style lang="scss">
</style>
