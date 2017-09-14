<template>
    <g :transform="`rotate(${-angle}, 50, 50)`">
    <line x1="50" y1="50" x2="99" y2="50" :stroke="color"/>
    <polygon
        points="91,46 99,50 91,54"
		class="handle"
        :stroke="color"
        :fill="color"
        @mouseover="startHover"
        @mouseout="endHover"
        @mousedown="startDrag"
    />
    </g>
</template>

<script>
export default {
    name: 'axis-arrow',
    props: ['angle', 'color'],
	data() {
		return {
			dragging: false
		};
	},
    methods: {
        startHover() {
            this.$emit('hoverstart');
        },
        endHover() {
            this.$emit('hoverend');
        },
		startDrag(event) {
			if (this.dragging)
				return;
			this.dragging = true;
            window.addEventListener('mousemove', this.drag);
            window.addEventListener('mouseup', this.endDrag);
            this.$emit('dragstart', {x: event.pageX, y: event.pageY});
		},
		drag(event) {
			if (this.dragging) {
                this.$emit('drag', {x: event.pageX, y: event.pageY});
			}
		},
		endDrag(event) {
			if (!this.dragging)
				return;
			this.dragging = false;
            window.removeEventListener('mousemove', this.drag);
            window.removeEventListener('mouseup', this.endDrag);
			this.$emit('dragend');
		}
    }
};
</script>
