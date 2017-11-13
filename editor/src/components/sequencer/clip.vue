<template>
    <rect :x="frameUnits(clip.start)"
          :y="0"
          :width="frameUnits(clip.duration)"
          :height="Const.timeline_track_height"
          class="clip"
          />
</template>
<script>
import Const, { ConstMixin } from 'chl/const';
export default {
    name: 'sequencer-clip',
    mixins: [ConstMixin],
    props: ['clip'],
    methods: {
        frameUnits(time) {
            return time*Const.timeline_frame_width;
        }
    }
};
</script>
<style scoped lang="scss">
@import './src/style/aesthetic.scss';
.clip {
    fill: $accent;
}
</style>
