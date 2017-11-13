<template>
    <div class="tracker-container">
    <div class="tracker-layers">
        <template v-for="(track, index) in tracks">
            <div :style="trackOffsetStyle(index)">{{ track.settings.name }}</div>
        </template>
    </div>
    <div class="tracks">
        <svg>
            <template v-for="(track, index) in tracks">
                <sequencer-track
                    :transform="trackOffsetTranslation(index)"
                    :settings="track.settings"
                    :clips="track.clips" />
            </template>
        </svg>
    </div>
    </div>
</template>

<script>
import Const from 'chl/const';
import SequencerTrack from './track';

export default {
    name: 'tracker',
    components: { SequencerTrack },
    data() {
        return {
            tracks: [
                {
                    settings: {
                        name: 'test',
                    },
                    clips: [
                        {
                            start: 0,
                            duration: 5
                        },
                        {
                            start: 6,
                            duration: 10,
                        }
                    ]
                },
                {
                    settings: {
                        name: 'test2',
                    },
                    clips: [
                        {
                            start: 1,
                            duration: 3
                        },
                        {
                            start: 6,
                            duration: 10,
                        }
                    ]
                }
            ],
        };
    },
    methods: {
        trackOffset(index) {
            return index * (Const.timeline_track_height + Const.timeline_track_padding);
        },
        trackOffsetStyle(index) {
            return {
                'top': `${this.trackOffset(index)}px`,
            };
        },
        trackOffsetTranslation(index) {
            return `translate(0, ${this.trackOffset(index)})`;
        }
    }
};
</script>

<style scoped lang="scss">
@import './src/style/aesthetic.scss';

.tracker-container {
    width: 100%;
    height: 100%;
    display: flex;
}

.tracker-layers {
    flex: initial;
    width: 200px;
    height: 100%;
    position: relative;

    div {
        position: absolute;
    }
}

.tracks {
    flex-grow: 1;
    height: 100%;
    width: 100%;
    position: relative;
}

svg {
    width: 100%;
    height: 100%;
    background-color: $panel-bg;
}
</style>
