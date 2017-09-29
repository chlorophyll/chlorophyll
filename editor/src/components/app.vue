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
                <toolbox-separator />
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
        <split-pane slot="second"
                    direction="horizontal"
                    :initial-split="[null, Const.sidebar_size]">
            <tab-set slot="first">
                <tab title="Pattern Editor"><pattern-editor /></tab>
            </tab-set>
            <div slot="second"><pattern-list /></div>
        </split-pane>
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

import Toolbox from '@/components/widgets/toolbox';
import ToolboxSeparator from '@/components/widgets/toolbox/separator';
import Tool from '@/components/widgets/toolbox/tool';

import TabSet from '@/components/widgets/tab-set';
import Tab from '@/components/widgets/tab-set/tab';

import MappingManager from '@/components/mapping_manager';
import PatternEditor from '@/components/patterns/editor';
import PatternList from '@/components/patterns/list';
import AnimationEditor from '@/components/animation_editor';
import Viewport from '@/components/viewport';

export default {
    name: 'app',
    mixins: [ConstMixin, HotkeyMixin],
    components: {
        AnimationEditor,
        Camera,
        MarqueeSelection,
        LineSelection,
        PlaneSelection,
        MappingManager,
        PatternEditor,
        PatternList,
        SplitPane,
        Toolbox,
        ToolboxSeparator,
        Tool,
        TabSet,
        Tab,
        Viewport,
    },
};
</script>
