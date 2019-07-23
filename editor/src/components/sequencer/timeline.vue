<template>
  <div class="grid-container">
    <div class="topbar panel inline" @click="selectedLayerId=null">
      <div class="control-row topbar-side" :style="sidebarStyle">
        <button class="square highlighted material-icons" @click="togglePlay">
          {{ runText }}
        </button>
        <button @click="onStop" class="square material-icons">stop</button>
        <div class="time">{{ this.timeFormatted }}</div>
      </div>
      <div class="topbar-clips" v-if="selectedClipId !== null">
        <div class="label">Selected clip</div>
        <div class="label">Mapping:</div>
        <select v-model="selectedClipMappingId">
          <option
            v-for="mapping in selectedClipAvailableMappings"
            :value="mapping.id"
          >
            {{ mapping.name }}
          </option>
        </select>
        <button
          class="warn square material-icons"
          @click="deleteSelectedClip"
          v-tooltip.top-right="'Delete clip'"
        >
          delete
        </button>
      </div>
    </div>
    <div class="clips panel" ref="clips">
      <div class="timeline-container" :style="timelineContainerStyle">
        <div class="sidebar-container" :style="sidebarStyle">
          <div class="sidebar" @click="deselect">
            <draggable
              v-model="outputOrder"
              :options="{group: 'outputs', handle: '.output-drag-handle'}"
              @start="({oldIndex}) => onStartOutputReorder(oldIndex)"
              @end="onEndOutputReorder"
            >
              <template v-for="output in outputs">
                <div class="output-container"
                  :style="sidebarOutputStyle(output)"
                >
                  <div :style="sidebarStyle">
                    <div
                      class="output item"
                      :class="{selected: selectedOutputId==output.id}"
                      style="height: 20px"
                    >
                      <div class="label" @click.stop="selectedOutputId=output.id">
                        <div class="output-drag-handle material-icons pointer">drag_handle</div>
                        <div class="output-group-list">
                        <template v-if="output.groups.length < 3">
                          <div
                            v-for="group in output.groups"
                            class="output-group"
                          >
                            {{ group.name }}
                          </div>
                        </template>
                        <template v-else>
                            <div class="output-group">{{ output.groups[0].name }}</div>
                            <div v-tooltip.right-start="output.groups.map(group => group.name).join(', ')">{{ output.groups.length-1 }} others</div>
                        </template>
                        </div>
                          <v-popover placement="right-start" :autoHide="true">
                            <div
                              v-tooltip.right-start="'Edit output groups'"
                              class="tooltip-target material-icons pointer"
                            >
                              edit
                            </div>
                            <template slot="popover">
                              <ul class="layer-tooltip">
                                <li
                                  v-for="group in group_list"
                                  :key="group.id"
                                  :class="{control: true, selected: output.groupIds.indexOf(group.id) !== -1}"
                                  @click="toggleGroupOutput(output, group)">
                                  <div>{{ group.name }}</div><span class="material-icons">check</span>
                                </li>
                              </ul>
                            </template>
                          </v-popover>
                      </div>
                    </div>
                    <draggable
                      :value="output.layerIds"
                      @input="layerIds => reorderLayers(output, layerIds)"
                      :options="{group: 'layers', handle: '.drag-handle'}"
                      @start="({oldIndex}) => onStartLayerReorder(output, oldIndex)"
                      @end="onEndLayerReorder"
                    >
                      <div
                        class="item"
                        :class="{selected: selectedLayerIds.has(layerId)}"
                        v-for="layerId in output.layerIds"
                        :key="layerId"
                        :style="previewLayerId == layerId ? sidebarPreviewStyle : sidebarLayerStyle"
                        @mouseenter="setCurDragLayer(layerId)"
                        @mouseleave="setCurDragLayer(null)"
                      >
                        <div class="label" @click.stop="selectLayer(layerId)">
                          <div class="drag-handle material-icons pointer">drag_handle</div>
                          <numeric-input
                            :dragscale="200"
                            style="width: 4em"
                            :value="layersById[layerId].opacity * 100"
                            :min="0"
                            :max="100"
                            :precision="0"
                            @input="val => setOpacity(layersById[layerId], val)"
                          />
                          <div style="flex: 1" />
                          <v-popover placement="right-start" :autoHide="true">
                            <div
                              v-tooltip.right-start="'Blending Mode'"
                              class="tooltip-target material-icons pointer"
                            >
                              filter
                            </div>
                            <template slot="popover">
                              <ul class="layer-tooltip">
                                <li
                                  v-for="mode in blendingModes"
                                  :key="mode.value"
                                  :class="{control: true, selected: layersById[layerId].blendingMode === mode.value}"
                                  v-close-popover
                                  @click="setMode(layersById[layerId], mode.value)">
                                  <div>{{ mode.description }}</div><span class="material-icons">check</span>
                                </li>
                              </ul>
                            </template>
                          </v-popover>
                          <div
                            v-if="previewLayerId===layerId"
                            :style="sidebarPreview"
                            class="preview"
                          >
                            <svg :width="width" :height="Const.timeline_track_height">
                              <g :transform="previewTransform">
                                <clip
                                  v-for="clip in clipsByLayerId[layerId]"
                                  :key="clip.id"
                                  :clip="clip"
                                  :scale="scale"
                                  :preview="true"
                                  :curDragLayerId="null"
                                  :layerOffset="0"
                                />
                              </g>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </draggable>
                  </div>
                  <div
                    v-if="previewOutputId==output.id"
                    :style="sidebarPreview"
                    class="preview"
                  >
                    <svg :width="width" :height="outputHeight(output)">
                      <g :transform="previewTransform">
                        <template v-for="(layerId, index) in output.layerIds">
                          <clip
                            v-for="clip in clipsByLayerId[layerId]"
                            :key="clip.id"
                            :clip="clip"
                            :scale="scale"
                            :preview="true"
                            :curDragLayerId="null"
                            :layerOffset="20+index*Const.timeline_track_height"
                          />
                        </template>
                      </g>
                    </svg>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
        <div class="canvas-container" :style="canvasContainerStyle" ref="canvasContainer">
          <div :style="canvasStyle" ref="canvas">
            <svg class="canvas" :width="canvasWidth" :height="totalHeight" @click="selectedClipId=null">
              <g transform="translate(0, -0.5)">
                <template v-for="[pos, {opacity, classed}] in visibleTicks">
                  <line :x1="pos" :x2="pos"
                        :y1="-4"   :y2="totalHeight"
                        :style="{opacity}"
                        :class="[classed, 'tick']"
                        />
                </template>
                <template v-for="({offset, height}, index) in layerLayout">
                  <line  x1="0"
                        :y1="offset+height"
                        :x2="canvasWidth"
                        :y2="offset+height"
                        class="layer-line" />
                  <template v-if="layers[index] !== null">
                    <rect :x="0"
                          :y="offset"
                          :width="canvasWidth"
                          :height="height"
                          class="layer"
                          :class="{selected: selectedLayerIds.has(layers[index].id)}"
                          @mouseover="setCurDragLayer(layers[index].id)"
                          @dragover="patternDragged"
                          @drop="patternDropped(layers[index].id, $event)" />
                  </template>
                  <template v-else>
                    <rect :x="0"
                          :y="offset"
                          :width="canvasWidth"
                          :height="height"
                          class="output-divider"
                      />
                  </template>
                </template>
                <clip
                  v-for="clip in clips"
                  :key="clip.id"
                  v-if="clip.layerId !== previewLayerId && outputIdsByClipId[clip.id] !== previewOutputId"
                  :clip="clip"
                  :scale="scale"
                  :preview="false"
                  :selected="selectedClipId === clip.id"
                  :curDragLayerId="curDragLayerId"
                  :layerOffset="clipOffsetsById[clip.id]"
                  @end-drag="endDrag"
                  @change-layer="changeClipLayer"
                  @select-clip="selectedClipId=clip.id"
                />
              </g>
              <line v-if="time > 0"
                    :x1="linePos" y1="0"
                    :x2="linePos" :y2="totalHeight"
                    class="time-scrubber" />

            </svg>
          </div>
        </div>
      </div>
    </div>
    <div class="bottombar panel" @click="selectedLayerId=null">
      <div class="control-row">
        <button
          :disabled="!selectedLayerId && !selectedOutputId"
          class="warn square material-icons"
          @click="deleteSelection"
          v-tooltip.top-right="deleteMessage"
        >
          delete
        </button>
        <button
          :disabled="!canDuplicate"
          class="square material-icons"
          v-tooltip.top-right="canDuplicate ? 'Duplicate Layer': null"
          @click="duplicateSelectedLayer"
        >
          queue
        </button>
        <div class="square" />
        <button
          class="square material-icons"
          v-tooltip.top-right="'Add New Output'"
          @click="addNewOutput"
        >
          add_to_queue
        </button>
      </div>
    </div>
    <div class="patterns panel">
      <div class="controls">
        <div class="control-row">
            <label>Scene:</label>
            <select class="control" v-model="timelineId">
                <option v-for="timeline in timelines" :value="timeline.id">{{ timeline.name }}</option>
            </select>
        </div>
        <div class="control-row">
          <div class="control no-label" @click="addNewTimeline"><button>Add new scene</button></div>
        </div>
      </div>
      <div class="timeline-list-container">
        <div class="timeline-list" v-if="timeline !== null">
          <hr />
          <h1>Scene Settings</h1>
          <div class="controls">
            <div class="control-row">
              <label>Name</label>
              <input class="control" type="text" v-model="timelineName" :disabled="timeline==null">
            </div>
          </div>
          <hr />
          <div class="flat-list">
            <ul>
              <li v-for="pattern in pattern_list" :key="pattern.id">
                <div draggable="true" @dragstart="dragPattern(pattern, $event)">{{pattern.name}}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import draggable from 'vuedraggable';
import * as d3 from 'd3';
import _ from 'lodash';
import * as THREE from 'three';
import {bindFramebufferInfo} from 'twgl.js';
import Const, { ConstMixin } from 'chl/const';
import modes from '@/common/util/blending_modes';
import viewports from 'chl/viewport';
import store, {newgid} from 'chl/vue/store';
import * as numeral from 'numeral';

import Timeline from '@/common/patterns/timeline';
import { currentModel } from 'chl/model';

import Util from 'chl/util';
import { mappingUtilsMixin } from 'chl/mapping';
import { patternUtilsMixin } from 'chl/patterns';
import { mapGetters, mapState } from 'vuex';
import {RunState} from 'chl/patterns/preview';

import Clip from '@/components/sequencer/clip';
import NumericInput from '@/components/widgets/numeric_input';

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

const layerDefaults = {blendingMode: modes[0].value, opacity: 1};

export default {
    name: 'timeline',
    store,
    components: { Clip, NumericInput, draggable },
    mixins: [mappingUtilsMixin, patternUtilsMixin, ConstMixin],
    data() {
        return {
            width: 0,
            height: 0,
            runner: null,
            runstate: RunState.Stopped,
            domain: [0, 5*60*60],
            time: 0,
            curDragLayerId: null,
            previewLayerId: null,
            previewOutputId: null,
            previewOffset: 0,
            dragPatternOffset: null,
            selectedLayerId: null,
            selectedClipId: null,
            selectedOutputId: null,
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
        ...mapState('pixels', [
            'groups',
        ]),
        ...mapGetters('timeline', [
            'timelines',
        ]),
        ...mapState('timeline', [
            'timelineOrder',
            'timelinesById',
            'outputsById',
            'layersById',
            'clipsById',
        ]),
        timelineId: {
            get() {
                return this.$store.state.timeline.curTimelineId;
            },
            set(val) {
                this.$store.commit('timeline/setCurTimelineId', val);
            },
        },
        selectedLayerIds() {
            const s = new Set();
            if (this.selectedOutputId !== null) {
                const output = this.outputsById[this.selectedOutputId];
                for (const layerId of output.layerIds) {
                    s.add(layerId);
                }
            } else if (this.selectedLayerId !== null) {
                s.add(this.selectedLayerId);
            }
            return s;
        },
        timeline() {
            return this.timelineId !== null ? this.timelinesById[this.timelineId] : null;
        },
        timelineName: {
            get() {
                return this.timeline !== null ? this.timeline.name : null;
            },
            set(name) {
                if (!this.timeline) {
                    return;
                }
                this.$store.commit('timeline/setTimelineName', {timelineId: this.timelineId, name});
            },
        },
        outputTexture() {
            return new THREE.Texture();
        },
        blendingModes() {
            return modes;
        },
        previewTransform() {
            return `translate(-${this.previewOffset}, 0)`;
        },
        scale() {
            return d3.scaleLinear().domain(this.domain).range([0, this.width]);
        },
        linePos() {
            return this.scale(this.time);
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
            const runner = this.runner;
            const {renderer} = viewports.getViewport('main');
            return () => {
                if (!this.running) {
                    return;
                }
                this.time++;
                const {texture, done} = runner.step();
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
        outputOrder: {
            get() {
                return this.timeline ? this.timeline.outputOrder : [];
            },
            set(outputOrder) {
                this.$store.commit('timeline/reorderOutputs', {
                    timelineId: this.timeline.id,
                    outputOrder,
                });
            },
        },
        outputs() {
            return this.outputOrder.map(outputId => {
                const output = this.outputsById[outputId];
                const groups = output.groupIds.map(groupId => this.groups[groupId]);

                return {
                    ...output,
                    groups,
                };
            });
        },
        layers() {
            return _.flatten(this.outputs.map(output => this.outputLayers(output)));
        },
        layersByOutputId() {
            const out = {};
            for (const output of this.outputs) {
                out[output.id] = output.layerIds.map(layerId => this.layersById[layerId]);
            }
            return out;
        },
        outputIdsByClipId() {
            const out = {};
            for (const clip of this.clips) {
                const layerId = clip.layerId;
                const layer = this.layersById[layerId];
                out[clip.id] = layer.outputId;
            }
            return out;
        },
        clipsByLayerId() {
            const clips = this.clips;
            return _.groupBy(clips, clip => clip.layerId);
        },
        clips() {
            const clipIds = this.timeline ? _.keys(this.timeline.clipIdSet) : [];
            return clipIds.map(clipId => {
                const clip = this.clipsById[clipId];
                return {
                    pattern: this.getPattern(clip.patternId),
                    mapping: this.getMapping(clip.mappingId),
                    ...clip,
                };
            });
        },
        canDuplicate() {
            if (!this.selectedLayerId) {
                return false;
            }
            const clips = this.clipsByLayerId[this.selectedLayerId] || [];
            return clips.length > 0;
        },
        runnableClips() {
            const out = [];
            for (const output of this.outputs) {
                const clips = this.outputClips(output);
                for (const clip of clips) {
                    const layer = this.layersById[clip.layerId];
                    out.push({
                        ...clip,
                        fadeInTime: 10*60,
                        fadeOutTime: 10*60,
                        groups: output.groups,
                        blendingMode: layer.blendingMode,
                        opacity: layer.opacity,
                    });
                }
            }
            return out;

        },
        layerIndexesById() {
            const out = {};
            let i = 0;
            for (const layer of this.layers) {
                if (layer) {
                    out[layer.id] = i;
                }
                i++;
            }
            return out;
        },
        layerLayout() {
            let sum = 0;
            const layers = [];
            for (const layer of this.layers) {
                const offset = sum;
                const height = layer === null ? 20 : Const.timeline_track_height;
                sum += height;
                layers.push({offset, height});
            }
            return layers;
        },
        clipOffsetsById() {
            const out = {};
            for (const clip of this.clips) {
                out[clip.id] = this.layerLayout[this.layerIndexesById[clip.layerId]].offset;
            }

            return out;
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
        sidebarLayerStyle() {
            return {
                height: `${Const.timeline_track_height}px`,
            };
        },
        sidebarPreview() {
            return {
                marginLeft: '0.25em',
                width: `${this.width-Const.sidebar_size}px`,
                height: '100%',
            };
        },
        sidebarPreviewStyle() {
            return {
                width: `${this.width}px`,
                height: `${Const.timeline_track_height}px`,
            };
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
        sidebarStyle() {
            return {
                width: `${Const.sidebar_size}px`,
            };
        },
        sidebarOutputStyle() {
            return (output) => {
                const width = this.previewOutputId === output.id ? this.width : Const.sidebar_size;
                return {
                    width: `${width}px`,
                    height: `${this.outputHeight(output)}px`,
                };
            }
        },
        canvasContainerStyle() {
            return {
                width: `${this.width - Const.sidebar_size}px`,
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
            return [];
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
                    if (out.get(tick) === undefined && tick !== 0) {
                        out.set(tick, { opacity, classed });
                    }
                }
            }
            return [...out.entries()];
        },
        snap() {
            return _.last(this.visibleIntervals).interval;
        },
        selectedClip() {
            const clip = this.selectedClipId ? this.clipsById[this.selectedClipId] : null;
            return clip;
        },
        selectedClipMappingId: {
            get() {
                return this.selectedClip ? this.selectedClip.mappingId : null;
            },
            set(mappingId) {
                if (!this.selectedClipId) {
                    return;
                }
                this.$store.commit('clip/setMappingId', {
                    clipId: this.selectedClipId,
                    mappingId,
                });
            },
        },

        selectedClipAvailableMappings() {
            if (!this.selectedClip) {
                return [];
            }
            const patternId = this.selectedClip.patternId;
            const pattern = this.getPattern(patternId);
            return this.mappingsByType[pattern.mapping_type];
        },
        deleteMessage() {
            if (this.selectedOutputId !== null) {
                return 'Delete selected output';
            } else if (this.selectedLayerId !== null) {
                return 'Delete selected layer';
            }
        },
    },
    watch: {
        runnableClips: {
            handler(clipList) {
                this.runner.updateClips(clipList);
                this.glReset();
            },
        },
        clipsById() {
            const clipId = this.selectedClipId;
            if (clipId && !this.clipsById[clipId]) {
                this.selectedClipId = null;
            }
        },
        layersById() {
            if (this.selectedLayerId && !this.layersById[this.selectedLayerId]) {
                this.selectedLayerId = null;
            }
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
        this.runner = new Timeline(gl, currentModel);
        this.glReset();

        if (this.timelines.length === 0) {
            this.addNewTimeline();
        }
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.resize);
    },
    methods: {
        addNewTimeline() {
            const name = Util.uniqueName('Scene ', this.timelines);
            const timelineId = newgid();
            this.$store.commit('timeline/addTimeline', {timelineId, name});
            this.timelineId = timelineId;
            this.addNewOutput();
        },
        addNewOutput() {
            const groups = [this.group_list[0]];
            this.addOutput(groups);
        },
        addOutput(groups) {
            const id = newgid();
            const groupIds = groups.map(group => group.id);
            const output = {
                id,
                groupIds,
                layerIds: [],
            };
            this.$store.commit('timeline/addOutput', {timelineId: this.timeline.id, output});
            this.addLayer(output, 0);
        },
        duplicateSelectedLayer() {
            if (!this.selectedLayerId) {
                return;
            }
            const layer = this.layersById[this.selectedLayerId];
            const {blendingMode, opacity, outputId} = layer;
            const output = this.outputsById[outputId];
            const layerIndex = output.layerIds.indexOf(this.selectedLayerId);
            const layerId = this.addLayer(output, layerIndex+1, {blendingMode, opacity});
            const origClips = this.clipsByLayerId[this.selectedLayerId] || [];

            const clips = origClips.map(clip => {
                const id = newgid();
                return {
                    ...clip,
                    id,
                    layerId,
                };
            });

            for (const clip of clips) {
                this.$store.commit('timeline/addClip', {
                    timelineId: this.timeline.id,
                    clip,
                });
            }
        },
        reorderLayers(output, layerIds) {
            this.$store.commit('timeline/reorderLayers', {
                outputId: output.id,
                layerIds,
            });
        },
        createClip(pattern, layerId) {
            const availableMappings = this.mappingsByType[pattern.mapping_type] || [];
            const mapping = availableMappings.length > 0 ? availableMappings[0] : null;
            const id = newgid();

            return {
                id,
                patternId: pattern.id,
                mappingId: mapping.id,
                layerId,
                time: 0,
                playing: false,
            };
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
        patternDropped(layerId, event) {
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
            const timelineId = this.timeline.id;
            this.$store.commit('timeline/addClip', {timelineId, clip});
            this.resolveOverlaps(clip.id);
            this.resolveGaps();
        },
        outputLayers(output) {
            return [null, ...output.layerIds.map(layerId => this.layersById[layerId])];
        },
        outputClips(output) {
            return _.flatten(output.layerIds.map(layerId => this.clipsByLayerId[layerId] || []));
        },
        addLayer(output, layerIndex, opts = {}, clips = []) {
            const {opacity, blendingMode} = {...layerDefaults, ...opts};
            const id = newgid();
            const outputId = output.id;
            const layer = {
                id,
                outputId,
                blendingMode,
                opacity,
            };
            this.$store.commit('timeline/addLayer', {
                layerIndex,
                outputId,
                layer,
            });
            for (const clip of clips) {
                this.$store.commit('timeline/changeClipLayer', {
                    clipId: clip.id,
                    layerId: id
                });
            }
            return id;
        },
        getOutputForClip(clip) {
            const layer = this.layersById[clip.layerId];
            const output = this.outputsById[layer.outputId];
            return output;
        },
        resize() {
            this.width = this.$refs.clips.clientWidth;
            this.height = this.$refs.clips.clientHeight;
        },
        changeClipLayer(clip, layerId) {
            if (clip.layerId === layerId) {
                return;
            }

            this.$store.commit('timeline/changeClipLayer', {
                clipId: clip.id,
                layerId,
            });
        },
        outputHeight(output) {
            const numLanes = output.layerIds.length;
            return 20+numLanes * Const.timeline_track_height;
        },
        isLayerEmpty(layerId) {
            const layerClips = this.clipsByLayerId[layerId] || [];
            return layerClips.length === 0;
        },
        resolveGaps() {
            for (const output of this.outputs) {
                const lastId = _.last(output.layerIds);
                const lastIsEmpty = lastId !== undefined && this.isLayerEmpty(lastId);

                const [empty, nonEmpty] = _.partition(output.layerIds,
                    layerId => this.isLayerEmpty(layerId) && layerId !== lastId
                );

                for (const layerId of empty) {
                    this.$store.commit('timeline/deleteLayer', {layerId});
                }
                if (!lastIsEmpty) {
                    this.addLayer(output, output.layerIds.length);
                }
            }
        },
        endDrag(clip, finalStartTime, finalEndTime) {
            const clipId = clip.id;
            const startTime = Util.roundToInterval(finalStartTime, this.snap);
            const endTime = Util.roundToInterval(finalEndTime, this.snap);
            this.$store.commit('timeline/setClipTime', {
                clipId,
                startTime,
                endTime,
            });
            this.resolveOverlaps(clipId);
            this.resolveGaps();
        },
        resolveOverlaps(targetClipId) {
            const targetClip = this.clipsById[targetClipId];
            const layerId = targetClip.layerId;
            const clips = this.clipsByLayerId[layerId];
            let overlap = false;

            for (const clip of clips) {
                if (clip.id === targetClip.id) {
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
                const output = this.getOutputForClip(targetClip);
                const layerIndex = output.layerIds.indexOf(layerId);
                const layer = this.layersById[layerId];
                this.addLayer(output, layerIndex+1, layer, [targetClip]);
            }
        },
        setMode(layer, blendingMode) {
            this.$store.commit('timeline/setLayerMode', {
                layerId: layer.id,
                blendingMode,
            });
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
        onStop() {
            this.runstate = RunState.Stopped;
        },
        stop() {
            this.pause();
            this.time = 0;
            currentModel.display_only = false;
            this.runner.stop();
            this.glReset();
        },
        setOpacity(layer, val) {
            const layerId = layer.id;
            const opacity = val / 100;
            this.$store.commit('timeline/setLayerOpacity', {
                layerId,
                opacity,
            });
        },
        onStartLayerReorder(output, index) {
            this.previewLayerId = output.layerIds[index];
            this.previewOffset = this.$refs.canvasContainer.scrollLeft;
        },
        onEndLayerReorder() {
            this.resolveGaps();
            this.previewLayerId = null;
        },
        onStartOutputReorder(index) {
            this.previewOutputId = this.outputOrder[index];
            this.previewOffset = this.$refs.canvasContainer.scrollLeft;
        },
        onEndOutputReorder() {
            this.previewOutputId = null;
        },
        deleteSelection() {
            const clipIds = [];
            for (const layerId of this.selectedLayerIds) {
                const layer = this.layersById[layerId];
                const clips = this.clipsByLayerId[this.selectedLayerId] || [];
                for (const clip of clips) {
                    clipIds.push(clip.id);
                }
            }
            this.$store.commit('timeline/deleteClipIds', {
                timelineId: this.timeline.id,
                clipIds,
            });
            this.resolveGaps();

            if (this.selectedOutputId !== null) {
                this.$store.commit('timeline/deleteOutput', {
                    timelineId: this.timeline.id,
                    outputId: this.selectedOutputId,
                });
            }
        },
        deleteSelectedClip() {
            if (this.selectedClipId === null) {
                return;
            }

            this.$store.commit('timeline/deleteClipIds', {
                timelineId: this.timeline.id,
                clipIds: [this.selectedClipId],
            });
            this.resolveGaps();
        },

        deselect() {
            this.selectedLayerId = null;
            this.selectedOutputId = null;
        },

        selectLayer(layerId) {
            this.selectedLayerId = layerId;
            this.selectedOutputId = null;
        },

        toggleGroupOutput(output, group) {
            const index = output.groupIds.indexOf(group.id);
            const groupIds = [...output.groupIds];
            if (index === -1) {
                groupIds.push(group.id);
            } else {
                groupIds.splice(index, 1);
            }
            this.$store.commit('timeline/setOutputGroups', {
                outputId: output.id,
                groupIds,
            });
        },

        setCurDragLayer(layerId) {
            this.curDragLayerId = layerId;
        },
    },
};
</script>

<style scoped lang="scss">
@import "~@/style/aesthetic.scss";

.grid-container {
  display: grid;
  grid-template-columns: 1fr 220px;
  grid-template-rows: 26px 1fr 26px;
  grid-template-areas: "topbar patterns" "clips patterns" "bottombar patterns";
  height: 100%;
  width: 100%;
}

h1 {
  margin-bottom: 0.25em;
}

.bottombar {
  grid-area: bottombar;
  border-top: 1px solid $panel-dark;
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

.output-container {
  display: flex;

}

.sidebar-container {
  display: flex;
  border-right: 1px solid $panel-dark;
  position: relative;

  .sidebar {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .item {
    border-bottom: 1px dotted $panel-dark;
    box-sizing: border-box;
    position: relative;
    width: 100%;

    &.selected {
      background-color: $accent;
    }

    .label {
      width: 100%;
      height: 100%;
      padding-left: 0.5em;
      padding-right: 0.5em;
      display: flex;
      align-items: center;
    }

    .drag-handle, .output-drag-handle {
      margin-right: 0.5em;
    }

    &.output {
      background-color: darken($panel-bg, 2%);
      &.selected {
        background-color: darken($accent, 5%);
      }
    }

    .output-group-list {
      flex: 1;
      display: flex;
      flex-wrap: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .output-group {
        border-radius: 7px/50%;
        padding-left: 7px;
        padding-right: 7px;
        margin-left: 3.5px;
        margin-right: 3.5px;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        min-width: 5em;
        max-width: 10em;
        width: fit-content;
        background-color: $base-blue-1;
    }

  }
}
.preview {
  display: block;
  background-color: $panel-bg;
  z-index: 2;
}

.patterns {
  grid-area: patterns;
  height: auto;
  overflow: auto;
  position: relative;
  display: flex;
  flex-direction: column;

  .flat-list {
    flex: 1;
    justify-self: stretch;
    overflow: auto;
  }

  .timeline-list, .timeline-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}
.topbar {
  display: flex;
  grid-area: topbar;
  border-bottom: 1px solid $panel-dark;

  .topbar-side, .topbar-clips {
    height: 26px;
    display: flex;
    align-items: center;
    padding-left: 0.25em;
  }

  .topbar-side {
    margin: 0;
    border-right: 1px solid $panel-dark;
  }

  .label {
    margin-right: 1em;
  }
}

.item .control-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.pointer {
  cursor: pointer;
}

.canvas {
  position: relative;
  display: block;
  text {
    fill: $panel-text;
  }

  .layer {
    stroke: none;
    fill: none;
    &.selected {
      fill: $control-highlight;
      opacity: 0.05;
    }
  }
  .layer-line {
    stroke-width: 1;
    stroke: darken($panel-bg, 5%);
  }

  .output-divider {
    fill: $panel-darker;
    opacity: 0.1;
  }
}

.time {
  margin-left: 1em;
}

.time-scrubber {
  stroke: darken($base-blue-1, 10%);
  stroke-width: 1;
}

.tick {
  stroke: white;
}
.tick-dotted {
  stroke-dasharray: 2,4;
}
.tick-minutes {
  &.tick-dotted {
    stroke-dasharray: 2,1;
  }
}

button.warn {
  background-color: $control-highlight-warn;
  color: $accent-text;
}
</style>

<style lang="scss">
@import "~@/style/aesthetic.scss";
.tooltip:focus {
  outline: none;
}
.tooltip:not(.popover) {
  display: block;
  z-index: 10000;
  background-color: $panel-dark;
  border-radius: $inset-radius;
  padding: 5px;
  color: $panel-text;
  font-size: 12px;
  .tooltip-arrow {
    width: 0;
    height: 0;
    border-style: solid;
    position: absolute;
    border-color: $panel-dark;
    z-index: 1;
  }

  &[x-placement^="top"] {
    margin-bottom: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 0 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      bottom: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

    &[x-placement^="bottom"] {
    margin-top: 5px;

    .tooltip-arrow {
      border-width: 0 5px 5px 5px;
      border-left-color: transparent !important;
      border-right-color: transparent !important;
      border-top-color: transparent !important;
      top: -5px;
      left: calc(50% - 5px);
      margin-top: 0;
      margin-bottom: 0;
    }
  }

  &[x-placement^="right"] {
    margin-left: 5px;

    .tooltip-arrow {
      border-width: 5px 5px 5px 0;
      border-left-color: transparent !important;
      border-top-color: transparent !important;
      border-bottom-color: transparent !important;
      left: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }

  &[x-placement^="left"] {
    margin-right: 5px;

    .tooltip-arrow {
      border-width: 5px 0 5px 5px;
      border-top-color: transparent !important;
      border-right-color: transparent !important;
      border-bottom-color: transparent !important;
      right: -5px;
      top: calc(50% - 5px);
      margin-left: 0;
      margin-right: 0;
    }
  }
}

.layer-tooltip {
  display: block;
  background-color: $panel-bg;
  border: 1px solid $panel-dark;
  border-radius: $inset-radius;
  box-shadow: 1px 1px 1px 0px rgba(0,0,0,0.25);
  font-size: 12px;
  color: $panel-text;

  list-style-type: none;
  padding-left: 0;

  height: 12.5em;
  overflow-y: scroll;

  li {
    padding: 0.25em;
    cursor: pointer;
    display: flex;
    align-items: center;

    div {
      flex: 1;
    }

    span {
      width: 1em;
      display: none;
    }

    &.selected {
      background-color: $accent;
      color: $accent-text;
      span {
        display: block;
        width: 1em;
      }
    }
  }

  li:hover {
    background-color: $panel-light;

    &.selected {
      background-color: $control-highlight;
    }
  }

}
</style>
