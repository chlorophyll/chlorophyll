<template>
    <span>
    <div ref="box" v-show="in_progress" :style="box_styles" />
    </span>
</template>

<script>
import Util from 'chl/util';
import { activeScreen, isClipped } from 'chl/viewport';
import { SelectionToolMixin } from 'chl/tools/selection';
import { currentModel } from 'chl/model';

export default {
    mixins: [...SelectionToolMixin('marquee-selection')],
    mounted() {
        document.getElementById('overlays').appendChild(this.$refs.box);
        this.viewport.addEventListener('mousedown', this.start, false);
    },
    data() {
        return {
            rect: {
                startX: 0,
                startY: 0,
                endX: 0,
                endY: 0,
            },
        };
    },
    computed: {
        box() {
            if (!this.in_progress)
                return;
            const l = Math.min(this.rect.startX, this.rect.endX);
            const r = Math.max(this.rect.startX, this.rect.endX);
            const t = Math.min(this.rect.startY, this.rect.endY);
            const b = Math.max(this.rect.startY, this.rect.endY);

            return [l, r, t, b];
        },
        box_styles() {
            if (!this.in_progress)
                return {};

            const [l, r, t, b] = this.box;

            return {
                left: `${l}px`,
                top: `${t}px`,
                width: `${r-l}px`,
                height: `${b-t}px`,
            };
        },
    },
    methods: {
        reset() {
            this.rect.startX = 0;
            this.rect.startY = 0;
            this.rect.endX = 0;
            this.rect.endY = 0;
            this.viewport.removeEventListener('mousemove', this.drag);
            this.viewport.removeEventListener('mouseup', this.end);
        },
        start(event) {
            if (!this.enabled)
                return;
            let {pageX, pageY} = event;
            let {x, y} = Util.relativeCoords(this.viewport, pageX, pageY);
            this.rect.startX = x;
            this.rect.startY = y;
            this.rect.endX = x;
            this.rect.endY = y;
            this.viewport.addEventListener('mousemove', this.drag, false);
            this.viewport.addEventListener('mouseup', this.end, false);
            this.startSelection(event);
        },
        drag(event) {
            let {pageX, pageY} = event;
            let {x, y} = Util.relativeCoords(this.viewport, pageX, pageY);
            this.rect.endX = x;
            this.rect.endY = y;

            const [l, r, t, b] = this.box;
            let current_selection = new Set(this.initial_selection);

            currentModel.forEach((strip, i) => {
                let v = currentModel.getPosition(i);
                if (isClipped(v))
                    return;

                let s = activeScreen().screenCoords(v);

                if (s.x >= l && s.x <= r && s.y >= t && s.y <= b) {
                    this.handlePixel(current_selection, i);
                }
            });
            this.updateInProgressSelection(current_selection);
        },
        end(event) {
            this.commitSelection();
        }
    }
};
</script>

<style scoped>
div {
    position: absolute;
    border: 1px dotted white;
}
</style>


