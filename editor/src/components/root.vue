<template>
    <split-pane direction="vertical" :initial-split="[null, Const.dock_size]">
        <split-pane slot="first"
                    direction="horizontal"
                    :initial-split="[null, Const.sidebar_size]">
            <split-pane slot="first" direction="horizontal"
                                     :initial-split="[Const.toolbar_size, null]">
                <selection-toolbar slot="first" :tools="selectionTools" />
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

import SplitPane from '@/components/widgets/split';

import TabSet from '@/components/widgets/tab-set';
import Tab from '@/components/widgets/tab-set/tab';

import MappingManager from '@/components/mapping_manager';
import PatternEditor from '@/components/patterns/editor';
import PatternList from '@/components/patterns/list';
import AnimationEditor from '@/components/animation_editor';
import SelectionToolbar from '@/components/toolbar';
import Viewport from '@/components/viewport';

export default {
    name: 'app',
    mixins: [ConstMixin],
    components: {
        AnimationEditor,
        MappingManager,
        PatternEditor,
        PatternList,
        SelectionToolbar,
        SplitPane,
        TabSet,
        Tab,
        Viewport,
    },

    data() {
        return {
            selectionTools: [],
        };
    }
};
</script>
