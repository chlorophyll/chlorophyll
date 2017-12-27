<template>
    <rect :x="position"
          :y="0"
          :width="duration"
          :height="Const.timeline_track_height"
          class="clip"
          />
</template>
<script>
import Const, { ConstMixin } from 'chl/const';
export default {
    name: 'sequencer-clip',
    mixins: [ConstMixin],
    props: ['scale', 'clip'],
    computed: {
        position() {
            return this.scale(this.clip.start);
        },
        duration() {
            const end = this.clip.start + this.clip.duration;
            return this.scale(end) - this.scale(this.clip.start);
        }
    },
};
</script>
<style scoped lang="scss">
@import './src/style/aesthetic.scss';
.clip {
    fill: $accent;
}
</style>
