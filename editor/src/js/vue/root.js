import Vue from 'vue';
import AnimEditor from '@/components/animation_editor';
import MappingManager from '@/components/mapping_manager';

export function RENDER_NONE(x) {
    x();
}

/*
 * Set up top-level components
 */
const AnimEditorComponent = Vue.extend(AnimEditor);
const MappingManagerComponent = Vue.extend(MappingManager);

export const animManager = new AnimEditorComponent();
export const mappingManager = new MappingManagerComponent();
