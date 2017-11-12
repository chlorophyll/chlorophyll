<template>
    <split-pane direction="vertical" :initial-split="[null, Const.dock_size]">
        <split-pane slot="first"
                    direction="horizontal"
                    :initial-split="[null, Const.sidebar_size]">
            <split-pane slot="first" direction="horizontal"
                                     :initial-split="[Const.toolbar_size, null]">
                <toolbox slot="first">
                <tool label="Camera"
                      :is-enabled="true"
                      :hotkey="Hotkey.camera"
                      :momentary-hotkey="Hotkey.momentary_camera"><camera /></tool>
                <div class="separator" />
                <tool label="Marquee"
                      :hotkey="Hotkey.select_marquee"><marquee-selection /></tool>
                <tool label="Line"
                      :hotkey="Hotkey.select_line"><line-selection /></tool>
                <tool label="Plane"
                      :hotkey="Hotkey.select_plane"><plane-selection /></tool>
                </toolbox>
                <viewport slot="second" />
            </split-pane>
            <mapping-manager slot="second" />
        </split-pane>
        <tab-set slot="second">
            <tab title="Pattern Editor"><pattern-editor /></tab>
            <tab title="Sequencer"><timeline-sequencer /></tab>
        </tab-set>
    </split-pane>
</template>

<script>
import { ConstMixin } from 'chl/const';
import { HotkeyMixin } from 'chl/keybindings';

import SplitPane from '@/components/widgets/split';
import MarqueeSelection from '@/components/tools/selection/marquee';
import LineSelection from '@/components/tools/selection/line';
import PlaneSelection from '@/components/tools/selection/plane';
import Camera from '@/components/tools/camera';

import Toolbox from '@/components/tools/toolbox';
import Tool from '@/components/tools/toolbox/tool';

import TabSet from '@/components/widgets/tab-set';
import Tab from '@/components/widgets/tab-set/tab';

import MappingManager from '@/components/mapping_manager';
import PatternEditor from '@/components/patterns/editor';
import TimelineSequencer from '@/components/sequencer/timeline_sequencer';
import Viewport from '@/components/viewport';

export default {
    name: 'app',
    mixins: [ConstMixin, HotkeyMixin],
    components: {
        TimelineSequencer,
        Camera,
        MarqueeSelection,
        LineSelection,
        PlaneSelection,
        MappingManager,
        PatternEditor,
        SplitPane,
        Toolbox,
        Tool,
        TabSet,
        Tab,
        Viewport,
    },
};
</script>
