<template>
    <div />
</template>

<script>
import { Line3, Plane } from 'three';

import Util from 'chl/util';
import { SelectionToolMixin } from 'chl/tools/selection';
import { currentModel, colorDisplay } from 'chl/model';

export default {
    mixins: [...SelectionToolMixin('plane-selection')],
    inject: ['localViewport'],
    data() {
        return {
            points: [],
        };
    },

    mounted() {
        this.$nextTick(() => {
            const vp = this.localViewport.$refs;
            vp.container.addEventListener('click', this.click);
        });
    },

    watch: {
        enabled() {
            if (!this.enabled && this.points.length > 0)
                this.cancelSelection();
        }
    },

    methods: {
        reset() {
            this.points = [];
        },
        click(event) {
            if (!this.enabled)
              return;

            event.stopPropagation();
            let {x, y} = this.localViewport.relativePageCoords(event.pageX, event.pageY);
            let chosen = this.localViewport.getPointAt(x, y);
            if (!chosen)
                return;

            if (this.points.length == 0) {
                this.startSelection(event);
            }
            this.points.push(chosen.index);

            if (this.points.length < 3) {
                this.updateInProgressSelection(this.points);
            } else {
                this.selectPlane();
            }
        },
        selectPlane() {
            let positions = this.points.map((p) => currentModel.getPosition(p));
            let line = new Line3(positions[0], positions[1]);
            let dist = Util.distanceToLine(positions[2], line, false);

            if (dist < colorDisplay.selection_threshold) {
                console.error('Points must not be collinear');
                this.cancelSelection();
                return;
            } else {
                let plane = new Plane().setFromCoplanarPoints(...positions);

                let current_selection = new Set(this.initial_selection);

                currentModel.forEach((strip, i) => {
                    const pos = currentModel.getPosition(i);
                    let planeToPoint = plane.distanceToPoint(pos);

                    if (Math.abs(planeToPoint) < colorDisplay.selection_threshold) {
                        this.handlePixel(current_selection, i);
                    }
                });

                this.commitSelection(current_selection);
            }
        }
    }
};
</script>
