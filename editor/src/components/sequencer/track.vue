<template>
    <g class="track">
    <g class="clips">
        <template v-for="clip in clips">
            <sequencer-clip :clip="clip" />
        </template>
    </g>
    </g>
</template>

<script>
import Const, { ConstMixin } from 'chl/const';

import SequencerClip from './clip';

export default {
    name: 'sequencer-track',
    mixins: [ConstMixin],
    components: { SequencerClip },
    props: ['index', 'settings', 'clips'],
};
</script>

<style scoped lang="scss">

text {
    font-size: 12px;
    fill: white;
}

</style>
