<template>
<div v-show="show" class="dialog-container">
<div v-show="show"
     class="dialog-box"
     v-bind:style="{ transform: `translate(${x}px, ${y}px)`, width }">
    <div class="title drag-handle" @mousedown="startDrag">
        {{ title }}
    </div>
    <div class="panel">
    <div class="content">
        <slot></slot>
    </div>
    <div class="panel-footer">
        <button v-if="ok_btn" class="highlighted" @click="close(true)">
            OK
        </button>
        <button v-if="cancel_btn" @click="close(false)">
            Cancel
        </button>
    </div>
    </div>
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
            default: '350px',
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

    },
};
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
.platform-darwin .dialog-container {
    margin-top: $darwin-titlebar-height;
}
.dialog-container {
    position: fixed;
    height: 100vh;
    width: 100vh;
    overflow: hidden;
    z-index: 100;
    top: 0;
    left: 0;
    pointer-events: none;
}
.dialog-box {
    width: 100%;
    height: auto;
    min-width: 100px;
    min-height: 50px;
    overflow: show;
    display: block;
    z-index: 100;
    pointer-events:auto;
}

.content {
    padding-bottom: 20px;
    position: relative;
}

.drag-handle {
    cursor: move;
}
</style>
