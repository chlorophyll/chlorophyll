<template>
    <div />
</template>

<script>
import { Line3 } from 'three';

import Util from 'chl/util';
import { SelectionToolMixin } from 'chl/tools/selection';
import { currentModel, colorDisplay } from 'chl/model';

export default {
    mixins: [...SelectionToolMixin('line-selection')],
    inject: ['localViewport'],
    data() {
        return {
            p1: null,
        };
    },
    mounted() {
        this.$nextTick(() => {
            const vp = this.localViewport.$refs;
            vp.container.addEventListener('click', this.click);
        });
    },

    methods: {
        reset() {
            this.p1 = null;
        },
        click(event) {
            if (!this.enabled)
                return;

            event.stopPropagation();

            let {pageX, pageY} = event;
            let {x, y} = this.localViewport.relativePageCoords(pageX, pageY);
            let chosen = this.localViewport.getPointAt(x, y);

            if (!chosen)
                return;

            if (this.p1 === null) {
                this.startSelection(event);
                this.p1 = chosen.index;
                this.updateInProgressSelection([this.p1]);
            } else {
                const pos1 = currentModel.getPosition(this.p1);
                const pos2 = currentModel.getPosition(chosen.index);

                const line = new Line3(pos1, pos2);
                const midpoint = pos1.clone().add(pos2).divideScalar(2);
                const rad = midpoint.clone().sub(pos1).length() + 0.1;
                const points = currentModel.pointsWithinRadius(midpoint, rad);

                let current_selection = new Set(this.initial_selection);

                for (let point of points) {
                    const dist = Util.distanceToLine(point.position, line);
                    if (dist < colorDisplay.selection_threshold)
                        this.handlePixel(current_selection, point.index);
                }

                this.commitSelection(current_selection);
            }

        }
    }
};
</script>
