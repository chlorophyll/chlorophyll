<template>
<div v-show="show"
     class="dialog-box panel"
     v-bind:style="{ left: `${x}px`, top: `${y}px`, width }">
    <div class="header drag-handle" @mousedown="startDrag">
        {{ title }}
    </div>
    <div class="content">
        <slot></slot>
    </div>
    <div class="panel-footer">
        <button v-if="ok_btn" @click="close(true)">
            OK
        </button>
        <button v-if="cancel_btn" @click="close(false)">
            Cancel
        </button>
    </div>
</div>
</template>

<script>
export default {
    name: 'dialog-box',
    props: {
        title: {
            type: String,
            default: 'Prompt',
        },
        ok_btn: {
            type: Boolean,
            default: true,
        },
        cancel_btn: {
            type: Boolean,
            default: true,
        },
        show: {
            type: Boolean,
            default: false,
        },
        width: {
            type: String,
            default: '300px',
        },
        pos: {
            type: Object,
            default() {
                return { x: 0, y: 0 };
            },
        },
    },
    data() {
        return {
            x: this.pos.x,
            y: this.pos.y,
        };
    },
    methods: {
        close(save) {
            this.$emit('close', save);
        },
        move(xpos, ypos) {
            if (typeof xpos !== 'undefined' &&
                typeof ypos !== 'undefined') {
                this.x = xpos;
                this.y = ypos;
            }
        },
        startDrag(event) {
            if (event.preventDefault) event.preventDefault();

            this.drag_x = event.clientX;
            this.drag_y = event.clientY;
            document.addEventListener('mousemove', this.drag);
            document.addEventListener('mouseup', this.endDrag);
        },
        drag(event) {
            if (event.preventDefault) event.preventDefault();

            const delta_x = event.clientX - this.drag_x;
            const delta_y = event.clientY - this.drag_y;
            this.drag_x = event.clientX;
            this.drag_y = event.clientY;
            this.x += delta_x;
            this.y += delta_y;
        },
        endDrag() {
            document.removeEventListener('mousemove', this.drag);
            document.removeEventListener('mouseup', this.endDrag);
        }

    }
};
</script>

<style scoped>
.dialog-box {
    position: fixed;
    height: auto;
    min-width: 100px;
    min-height: 50px;
    overflow: auto;
    display: block;

    border: 1px solid #202020;
}

.content {
    padding-bottom: 20px;
}

.drag-handle {
    cursor: move;
}
</style>
