<template>
    <span>
    <div ref="box" v-show="in_progress" :style="box_styles" />
    </span>
</template>

<script>
import { SelectionToolMixin } from 'chl/tools/selection';
import { currentModel } from 'chl/model';

export default {
    mixins: [...SelectionToolMixin('marquee-selection')],
    inject: ['localViewport'],
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
    mounted() {
        this.$nextTick(() => {
            const vp = this.localViewport.$refs;
            vp.overlay.appendChild(this.$refs.box);
            vp.container.addEventListener('mousedown', this.start, false);
        });
    },

    methods: {
        reset() {
            this.rect.startX = 0;
            this.rect.startY = 0;
            this.rect.endX = 0;
            this.rect.endY = 0;

            const vp = this.localViewport.$refs;
            vp.container.removeEventListener('mousemove', this.drag);
            vp.container.removeEventListener('mouseup', this.end);
        },
        start(event) {
            if (!this.enabled)
                return;
            let {pageX, pageY} = event;
            let {x, y} = this.localViewport.relativePageCoords(pageX, pageY);
            this.rect.startX = x;
            this.rect.startY = y;
            this.rect.endX = x;
            this.rect.endY = y;

            const vp = this.localViewport.$refs;
            vp.container.addEventListener('mousemove', this.drag);
            vp.container.addEventListener('mouseup', this.end);

            this.startSelection(event);
        },
        drag(event) {
            let {pageX, pageY} = event;
            let {x, y} = this.localViewport.relativePageCoords(pageX, pageY);
            this.rect.endX = x;
            this.rect.endY = y;

            const [l, r, t, b] = this.box;
            let current_selection = new Set(this.initial_selection);

            currentModel.forEach((strip, i) => {
                let v = currentModel.getPosition(i);
                if (this.localViewport.isClipped(v))
                    return;

                let s = this.localViewport.screenCoords(v);

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


