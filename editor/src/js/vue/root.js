import Vue from 'vue';
import Viewport from '@/components/viewport';
import Toolbar from '@/components/toolbar';
import AnimEditor from '@/components/animation_editor';
import MappingManager from '@/components/mapping_manager';

export function RENDER_NONE(x) {
    x();
}

/*
 * Set up top-level components
 */
const ToolbarComponent = Vue.extend(Toolbar);
const AnimEditorComponent = Vue.extend(AnimEditor);
const MappingManagerComponent = Vue.extend(MappingManager);

export const toolbarManager = new ToolbarComponent();
export const animManager = new AnimEditorComponent();
export const mappingManager = new MappingManagerComponent();

export const viewportManager = new Vue(Viewport);
