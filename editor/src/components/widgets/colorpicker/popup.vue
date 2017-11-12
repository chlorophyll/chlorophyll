<template>
<div ref="overlay" v-show="active" class="overlay" @click="$emit('blur')">
    <div ref="popup" class="popup" @click.stop>
        <div ref="satval" class="satval" :style="hue_bg" @mousedown="satValDrag">
            <div class="satvalpicker" :style="satval_pos">
                <div />
            </div>
        </div>
        <div ref="hue" class="hue" @mousedown="hueDrag">
            <div class="huepicker" :style="hue_pos"/>
        </div>
    </div>
</div>
</template>

<script>
import keyboardJS from 'keyboardjs';
import Hotkey from 'chl/keybindings';
import Util from 'chl/util';

import * as tinycolor from 'tinycolor2';

export default {
    props: ['value', 'active'],
    name: 'colorpicker-popup',
    data() {
        return {
            color: tinycolor(this.value).toHsv(),
        };
    },
    mounted() {
        const {top, left} = Util.offset(this.$parent.$el);
        const popup = this.$refs.popup;
        popup.style.position = 'absolute';
        popup.style.top = `calc(${top}px + 1.5em)`;
        popup.style.left = `${left-200}px`;
    },
    computed: {
        satval_pos() {
            return {
                left: `${this.color.s*100}%`,
                top: `${(1-this.color.v)*100}%`,
            };
        },
        hue_bg() {
            return {
                backgroundColor: `hsl(${this.color.h}, 100%, 50%)`,
            };
        },

        hue_pos() {
            return {
                top: `${100*(this.color.h / 360)}%`,
            };
        }
    },
    watch: {
        color(newval) {
            this.$emit('input', tinycolor(newval).toHexString());
        },
        active(newval) {
            if (newval) {
                this.color = tinycolor(this.value).toHsv();
                keyboardJS.bind(Hotkey.cancel, this.deactivate);
            } else {
                keyboardJS.unbind(Hotkey.cancel, this.deactivate);
            }
        }
    },
    methods: {
        satValDrag() {
            window.addEventListener('mousemove', this.setSatVal);
            window.addEventListener('mouseup', this.endSatValDrag, true);
            this.setSatVal(event);
        },
        setSatVal(event) {
            const { pageX, pageY } = event;
            const { x, y } = Util.relativeCoords(this.$refs.satval, pageX, pageY);
            const pctX = Util.clamp(x / this.$refs.satval.clientWidth, 0, 1);
            const pctY = Util.clamp(y / this.$refs.satval.clientHeight, 0, 1);

            const s = pctX;
            const v = 1-pctY;
            const h = this.color.h;

            this.color = {h, s, v};
        },
        endSatValDrag(event) {
            this.captureClick();
            window.removeEventListener('mousemove', this.setSatVal);
            window.removeEventListener('mouseup', this.endSatValDrag, true);
        },

        hueDrag(event) {
            window.addEventListener('mousemove', this.setHue);
            window.addEventListener('mouseup', this.endHueDrag, true);
            this.setHue(event);
        },

        setHue(event) {
            const { pageX, pageY } = event;
            const { y } = Util.relativeCoords(this.$refs.hue, pageX, pageY);

            const pct = Util.clamp(y / this.$refs.hue.clientHeight, 0, 1);


            const s = this.color.s;
            const v = this.color.v;
            const h = 360*pct;

            this.color = {h, s, v};
        },

        endHueDrag(event) {
            this.captureClick();
            window.removeEventListener('mousemove', this.setHue);
            window.removeEventListener('mouseup', this.endHueDrag, true);
        },

        deactivate() {
            this.$emit('blur');
        },

        captureClick() {
            const handler = (event) => {
                event.stopPropagation();
                window.removeEventListener('click', handler, true);
            };
            window.addEventListener('click', handler, true);
        },
    }
};

</script>

<style scoped>
.overlay {
    position: fixed;
    z-index: 100;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.popup {
    background-color: #222;
    width: 200px;
    height: 200px;
    display: flex;
    flex-flow: row;
    padding: 20px;
}
.satval {
    position: relative;
    overflow: hidden;
    cursor: crosshair;
    flex: 1;
    background-image:
        linear-gradient(to top, #000 0%, transparent 100%),
        linear-gradient(to right, #fff 0%, transparent 100%);
}

.satvalpicker div {
    width: 10px;
    height: 10px;
    border-radius: 5px;
    border: 1px solid black;
}

.satvalpicker {
    position: relative;
    margin: -6px -6px;
    width: 12px;
    height: 12px;
    border: 1px solid white;
    border-radius: 6px;
}

.huepicker {
    position: absolute;
    left: -2px;
    border-top: 1px solid black;
    border-bottom: 1px solid black;
    outline: 1px solid white;
    width: 24px;
    height: 8px;
}
.hue {
    position: relative;
    flex: 0 0 20px;
    margin-left: 5px;
    background-image:
        linear-gradient(to bottom, hsl(  0, 100%, 50%),
                                   hsl( 60, 100%, 50%),
                                   hsl(120, 100%, 50%),
                                   hsl(180, 100%, 50%),
                                   hsl(240, 100%, 50%),
                                   hsl(300, 100%, 50%),
                                   hsl(360, 100%, 50%));
}
</style>
