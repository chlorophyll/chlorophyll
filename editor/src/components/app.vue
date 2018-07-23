<template>
    <split-pane direction="vertical" :initial-split="[null, Const.dock_size]">
        <split-pane slot="first"
                    direction="horizontal"
                    :initial-split="[null, Const.sidebar_size]">
            <split-pane slot="first"
                        direction="horizontal"
                    :initial-split="[Const.sidebar_size, null]">
                <group-browser slot="first" />
                <viewport slot="second"
                          label="main"
                          projection="perspective"
                          :show-toolbox="true">
                    <tool label="C"
                          :is-enabled="true"
                          :hotkey="Hotkey.camera"
                          :momentary-hotkey="Hotkey.momentary_camera"><camera /></tool>
                    <tool label="M"
                          :hotkey="Hotkey.select_marquee"><marquee-selection /></tool>
                    <tool label="L"
                          :hotkey="Hotkey.select_line"><line-selection /></tool>
                    <tool label="P"
                          :hotkey="Hotkey.select_plane"><plane-selection /></tool>
                </viewport>
            </split-pane>
            <mapping-browser slot="second" />
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

import Tool from '@/components/tools/toolbox/tool';

import TabSet from '@/components/widgets/tab-set';
import Tab from '@/components/widgets/tab-set/tab';

import GroupBrowser from '@/components/mapping/group_browser';
import MappingBrowser from '@/components/mapping/mapping_browser';
import PatternEditor from '@/components/patterns/editor';
import TimelineSequencer from '@/components/sequencer/timeline_sequencer';
import Viewport from '@/components/viewport';

export default {
    name: 'app',
    mixins: [ConstMixin, HotkeyMixin],
    components: {
        TimelineSequencer,
        Camera,
        GroupBrowser,
        MappingBrowser,
        MarqueeSelection,
        LineSelection,
        PlaneSelection,
        PatternEditor,
        SplitPane,
        Tool,
        TabSet,
        Tab,
        Viewport,
    },
};
</script>
