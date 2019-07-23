<template>
  <div class="grid-container">
    <div class="topbar panel inline">
        <div class="control-row">
      <button class="square highlighted material-icons" @click="togglePlay">
        {{ runText }}
      </button>
      <button @click="stop" class="square material-icons">stop</button>
      {{ this.timeFormatted }}
        </div>
    </div>
    <div class="clips panel" ref="clips">
      <div class="timeline-container" :style="timelineContainerStyle">
      <div class="output-list" :style="outputListStyle">
          <template v-for="{output, height, offset} in outputLayout">
              <div class="output" :style="outputStyle({height, offset})"><div class="name" :style="{height: `${Const.timeline_track_height}px`}"><div>{{ output.groups[0].name }}</div></div></div>
          </template>
      </div>
      <div class="canvas-container" :style="canvasContainerStyle">
        <div :style="canvasStyle" ref="canvas">
        <svg class="canvas" :width="canvasWidth" :height="totalHeight">
        <g transform="translate(0, -0.5)">
        <template v-for="[pos, {opacity, classed}] in visibleTicks">
          <line :x1="pos" :x2="pos"
                :y1="-4"   :y2="totalHeight"
                :style="{opacity}"
                :class="[classed, 'tick']"
                />
        </template>
        <template v-for="{offset, output, height} in outputLayout">
            <g :transform="`translate(0, ${offset})`">
            <g>
            <template v-for="(layer, index) in output.layers">
                <rect x="0"
                      :y="index*Const.timeline_track_height"
                      :width="canvasWidth"
                      :height="Const.timeline_track_height"
                      class="layer"
                      @dragover="patternDragged"
                      @drop="patternDropped(output, layer.id, $event)"
                  />
            </template>
              <template v-for="clip in output.clips">
                <clip
                  :clip="clip"
                  :output="output"
                  :scale="scale"
                  :snap="snap"
                  :layerIndex="layerIndexesById[clip.layerId]"
                  @change-layer="newLayerIndex => changeClipLayer(output, clip, newLayerIndex)"
                  @end-drag="endDrag(output, clip)"
                  />
              </template>
            </g>
            <rect x="0"
                  :y="height-32"
                  :width="canvasWidth"
                  height="32"
                  class="layer"
                  @dragover="patternDragged"
                  @drop="patternDroppedOnGhost(output, $event)"
            />
            </g>
        </template>
        </g>
      </svg>
        </div>
      </div>
      </div>
    </div>
    <div class="patterns panel">
      <div class="flat-list">
        <ul>
          <li v-for="pattern in pattern_list" :key="pattern.id">
            <div draggable="true" @dragstart="dragPattern(pattern, $event)">{{pattern.name}}</div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
/*

      <!--
      -->
      */
import * as d3 from 'd3';
import _ from 'lodash';
import * as THREE from 'three';
import {bindFramebufferInfo} from 'twgl.js';
import Const, { ConstMixin } from 'chl/const';
import draggable from 'vuedraggable';
import viewports from 'chl/viewport';
import store, {newgid} from 'chl/vue/store';
import * as numeral from 'numeral';

import Timeline from '@/common/patterns/timeline';
import { currentModel } from 'chl/model';

import Util from 'chl/util';
import { mappingUtilsMixin } from 'chl/mapping';
import { patternUtilsMixin } from 'chl/patterns';
import { mapGetters } from 'vuex';
import {RunState} from 'chl/patterns/preview';

import Clip from '@/components/sequencer/clip';

const DISPLAY_THRESHOLD = 10;
function frame(interval) {
    return {interval, classed: 'tick-frame'};
}
function seconds(inp) {
    const interval = inp*60;
    return {interval, classed: 'tick-seconds'};
}
function minutes(inp) {
    const interval = inp*60*60;
    return {interval, classed: 'tick-minutes'};
}
const tickIntervals = [
  ...[1, 15, 30].map(frame),
  ...[1, 5, 10, 15, 30].map(seconds),
  ...[1, 5].map(minutes),
].reverse();

const MAX_SCENE_LENGTH = 60*60*60;

export default {
    name: 'mixer',
    store,
    components: { draggable, Clip },
    mixins: [mappingUtilsMixin, patternUtilsMixin, ConstMixin],
    data() {
        return {
            width: 0,
            height: 0,
            timeline: null,
            runstate: RunState.Stopped,
            outputs: [],
            domain: [0, 5*60*60],
            time: 0,
        };
    },
    computed: {
        ...mapGetters('pattern', [
            'pattern_list',
        ]),
        ...mapGetters('mapping', [
            'mapping_list',
        ]),
        ...mapGetters('pixels', [
            'group_list',
        ]),
        outputTexture() {
            return new THREE.Texture();
        },
        scale() {
            return d3.scaleLinear().domain(this.domain).range([0, this.width]);
        },
        canvasWidth() {
            return this.scale(MAX_SCENE_LENGTH);
        },
        runText() {
            return this.running ? 'pause' : 'play_arrow';
        },
        running() {
            return this.runstate === RunState.Running;
        },
        stopped() {
            return this.runstate === RunState.Stopped;
        },
        step() {
            const timeline = this.timeline;
            const {renderer} = viewports.getViewport('main');
            return () => {
                if (!this.running) {
                    return;
                }
                this.time++;
                const {texture, done} = timeline.step();
                const properties = renderer.properties.get(this.outputTexture);
                properties.__webglTexture = texture;
                properties.__webglInit = true;
                this.glReset();
                currentModel.setFromTexture(this.outputTexture);
                if (done) {
                    this.runstate = RunState.Stopped;
                }
            }
        },
        outputLayout() {
            let sum = 0;
            let outputs = [];
            for (const output of this.outputs) {
                const offset = sum;
                const height = this.outputHeight(output);
                sum += height;
                outputs.push({output, offset, height});
            }
            return outputs;
        },
        totalHeight() {
            const outputHeight = _.sumBy(this.outputLayout, layout => layout.height);
            return Math.max(this.height, outputHeight);
        },
        timelineContainerStyle() {
            return {
                height: `${this.height}px`,
            };
        },
        outputListStyle() {
            return {
                width: '200px',
            };
        },
        canvasContainerStyle() {
            return {
                width: `${this.width - 200}px`,
                height: `${this.totalHeight}px`,
            };
        },
        canvasStyle() {
            return {
                width: `${this.canvasWidth}px`,
                height: `${this.totalHeight}px`,
            };
        },
        currentClips() {
            return _.flatten(this.outputs.map(output => output.clips.map(clip => {
                const layerIndex = this.layerIndexesById[clip.layerId];
                const layer = output.layers[layerIndex];
                return {
                    ...clip,
                    layerIndex,
                    blendingMode: layer.blendingMode,
                    group: output.groups[0],
                };
            })));
        },

        layerIndexesById() {
            const layerIndexesById = {};
            for (const output of this.outputs) {
                for (let i = 0; i < output.layers.length; i++) {
                    const layer = output.layers[i];
                    layerIndexesById[layer.id] = i;
                }
                if (output.pendingLayer) {
                    layerIndexesById[output.pendingLayer.id] = output.layers.length;
                }
            }
            return layerIndexesById;
        },

        timeFormatted() {
            const totalSeconds = this.time / 60;
            const seconds = totalSeconds % 60;
            const minutes = Math.floor(totalSeconds / 60);
            const minutesString = numeral(minutes).format('00');
            const secondsString = numeral(seconds).format('00.0');

            return `${minutesString}:${secondsString}`;
        },

        visibleIntervals() {
            return tickIntervals.filter(({interval}) => {
                const diff = this.scale(interval);
                return diff >= DISPLAY_THRESHOLD;
            }).map(tick => ({...tick, step: Math.log2(tick.interval)}));
        },

        visibleTicks() {
            if (this.canvasWidth == 0) {
                return [];
            }
            const start = 0;
            const end = MAX_SCENE_LENGTH;
            const out = new Map();

            const visibleIntervals = this.visibleIntervals;

            const stepMin = _.last(visibleIntervals).step;
            const stepMax = _.first(visibleIntervals).step;
            for (let { interval, classed, step} of visibleIntervals) {
                let opacity = d3.easeQuadIn(Util.map(step, stepMin, stepMax, 0.15, 1));
                opacity = _.clamp(opacity, 0.15, 1);
                const istart = Math.ceil(start / interval) * interval;
                const iend = Math.floor(end / interval) * interval;
                if (opacity < 0.5) {
                    classed += ' tick-dotted';
                }
                let curTicks = d3.range(istart, iend+interval, interval).map(this.scale);
                for (let tick of curTicks) {
                    if (out.get(tick) === undefined) {
                        out.set(tick, { opacity, classed });
                    }
                }
            }
            out.delete(0);
            return [...out.entries()];
        },

        snap() {
            return _.last(this.visibleIntervals).interval;
        },
    },
    watch: {
        currentClips: {
            handler(clipList) {
                this.timeline.updateClips(this.currentClips);
            },
        },
        runstate(state) {
            switch(state) {
                case RunState.Running: {
                    this.start();
                    break;
                }
                case RunState.Paused: {
                    this.pause();
                    break;
                }
                case RunState.Stopped: {
                    this.stop();
                    break;
                }
            }
        },
    },
    mounted() {
        window.addEventListener('resize', this.resize);
        this.resize();

        const {renderer} = viewports.getViewport('main');
        const gl = renderer.getContext();
        this.timeline = new Timeline(gl, currentModel);

        const initialOutputGroups = [this.group_list[0]];
        this.addOutput(initialOutputGroups);
        this.addOutput([this.group_list[1]]);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.resize);
    },
    methods: {
        addOutput(groups) {
            const id = newgid();
            this.outputs.push({
                id,
                groups,
                layers: [],
                clips: [],
                pendingLayer: null,
                dragPatternOffset: null,
            });
        },
        createClip(pattern, layerId) {
            const group = this.group_list[0];
            const availableMappings = this.mappingsByType[pattern.mapping_type] || [];
            const mapping = availableMappings.length > 0 ? availableMappings[0] : null;
            const id = newgid();

            return {
                id,
                pattern,
                group,
                mapping,
                layerId,
                time: 0,
                playing: false,
            };
        },
        playClip(clip) {
            clip.playing = true;
            this.mixer.playClip(clip.id);
        },

        stopClip(clip) {
            clip.playing = false;
            this.mixer.stopClip(clip.id);
            this.updateTimes();
        },

        pauseClip(clip) {
            clip.playing = false;
            this.mixer.pauseClip(clip.id);
        },

        run() {
            this.step();
            if (this.running) {
                this.request_id = window.requestAnimationFrame(() => this.run());
            }
        },
        glReset() {
            const {renderer} = viewports.getViewport('main');
            const gl = renderer.getContext();
            bindFramebufferInfo(gl, null);
            renderer.state.reset();
        },
        dragPattern(pattern, event) {
            event.dataTransfer.setData('text/plain', pattern.id);
            event.dataTransfer.dragEffect = 'link';
            this.dragPatternOffset = event.offsetX;
        },
        patternDragged(event) {
            event.preventDefault();
        },
        coords(pageX, pageY) {
            return Util.relativeCoords(this.$refs.canvas, pageX, pageY);
        },
        _createClipFromDrop(event, layerId) {
            const patternId = event.dataTransfer.getData('text');
            const pattern = this.getPattern(patternId);
            const clip = this.createClip(pattern, layerId);

            const {pageX, pageY} = event;
            const coords = this.coords(pageX, pageY);
            const startTime = Util.roundToInterval(this.scale.invert(coords.x-this.dragPatternOffset), this.snap);
            const endTime = startTime + 60*60;
            clip.startTime = startTime;
            clip.endTime = endTime;
            this.dragPatternOffset = 0;
            return clip;
        },
        patternDropped(output, layerId, event) {
            const clip = this._createClipFromDrop(event, layerId);
            output.clips.push(clip);
            this.resolveOverlaps(output, clip);
        },

        addLayer(output, layerIndex, blendingMode, clips) {
            const id = newgid();
            const layer = {
                id,
                blendingMode,
            };
            for (const clip of clips) {
                clip.layerId = id;
            }
            output.layers.splice(layerIndex, 0, layer);
        },

        addToPendingLayer(output, blendingMode, clip) {
            if (!output.pendingLayer) {
                output.pendingLayer = {
                    id: newgid(),
                    blendingMode,
                };
            }
            clip.layerId = output.pendingLayer.id;
        },

        patternDroppedOnGhost(output, event) {
            const clip = this._createClipFromDrop(event);
            output.clips.push(clip);
            this.addLayer(output, output.layers.length, 1, [clip]);
        },
        resize() {
            this.width = this.$refs.clips.clientWidth;
            this.height = this.$refs.clips.clientHeight;
        },

        changeClipLayer(output, clip, newLayerIndex) {
            const targetLayerIndex = _.clamp(newLayerIndex, 0, output.layers.length);
            const layerIndex = this.layerIndexesById[clip.layerId];
            if (targetLayerIndex === layerIndex) {
                return;
            }
            const layer = output.layers[layerIndex];
            if (targetLayerIndex === output.layers.length) {
                this.addToPendingLayer(output, layer.blendingMode, clip);
            } else {
                const newLayer = output.layers[targetLayerIndex];
                if (output.pendingLayer && clip.layerId === output.pendingLayer.id) {
                    output.pendingLayer = null;
                }
                clip.layerId = newLayer.id;
                this.resolveOverlaps(output, clip);
            }
        },

        outputHeight(output) {
            const numLanes = 1 + output.layers.length + (output.pendingLayer ? 1 : 0);
            return numLanes * Const.timeline_track_height;
        },
        outputStyle({offset, height}) {
            return {
                top: `${offset}px`,
                height: `${height}px`,
            };
        },
        endDrag(output, clip) {
            if (output.pendingLayer && clip.layerId === output.pendingLayer.id) {
                output.layers.push(pendingLayer);
            }
            output.pendingLayer = null;
            this.resolveOverlaps(output, clip);
            const layersUsed = new Set(output.clips.map(clip => clip.layerId));
            output.layers = output.layers.filter(layer => layersUsed.has(layer.id));
        },

        resolveOverlaps(output, targetClip) {
            const layerId = targetClip.layerId;
            let overlap = false;

            for (const clip of output.clips) {
                if (clip.id === targetClip.id || clip.layerId !== layerId) {
                    continue;
                }
                const first  = _.minBy([clip, targetClip], clip => clip.startTime);
                const second = _.maxBy([clip, targetClip], clip => clip.startTime);
                // if the clip starting first ends after the second one starts, overlap
                if (first.endTime > second.startTime) {
                    overlap = true;
                    break;
                }
            }

            if (overlap) {
                const layerIndex = this.layerIndexesById[targetClip.layerId];
                const layer = output.layers[layerIndex];
                this.addLayer(output, layerIndex+1, layer.blendingMode, [targetClip]);
            }
        },

        togglePlay() {
            if (this.runstate == RunState.Running) {
                this.runstate = RunState.Paused;
            } else {
                this.runstate = RunState.Running;
            }
        },
        start() {
            currentModel.display_only = true;
            this.run();
        },
        run() {
            this.step();
            if (this.running) {
                this.request_id = window.requestAnimationFrame(this.run);
            }
        },
        pause() {
            if (this.request_id !== null) {
                window.cancelAnimationFrame(this.request_id);
            }
            this.request_id = null;
        },
        stop() {
            this.pause();
            this.time = 0;
            currentModel.display_only = false;
            this.timeline.stop();
            this.glReset();
        }
    },
};
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";
.grid-container {
    display: grid;
    grid-template-columns: 1fr 220px;
    grid-template-rows: 26px 1fr;
    grid-template-areas: "topbar patterns" "clips patterns";
    height: 100%;
    width: 100%;
}

.output {
    border-bottom: 1px solid $panel-dark;
    position: absolute;
    width: 100%;
    .name {
        width: 100%;
        display: flex;
        align-items: center;
    }
}

.target {
  position: relative;
}

.clips {
    grid-area: clips;
    position: relative;
    height: auto;
    display: flex;
    width: 100%;
    overflow: hidden;
}

.canvas-container {
    overflow-x: scroll;
    overflow-y: hidden;
    height: 100%;
}

.timeline-container {
    display: flex;
    overflow-y: scroll;
}

.output-list {
    position: relative;
    border-right: 1px solid $panel-dark;
}

.patterns {
    grid-area: patterns;
    height: auto;
    overflow: auto;
    position: relative;

    .flat-list {
        height: calc(100% - 10px);
    }
}
.topbar {
    grid-area: topbar;

    .topline-text {
        height: 26px;
        display: flex;
        align-items: center;
    }
}

.canvas {
    position: relative;
    display: block;
    text {
        fill: $panel-text;
    }

    .output {
        fill: $panel-bg;
    }

    .layer {
        stroke-width: 1;
        stroke: $panel-dark;
        fill: none;
    }
}

.tick {
    stroke: white;
}
.tick-dotted {
    stroke-dasharray: 8,24;
}
.tick-minutes {
    &.tick-dotted {
        stroke-dasharray: 2,1;
    }
}
</style>
