import * as THREE from 'three';
import RawPatternRunner from '@/common/patterns/runner';
import viewports from 'chl/viewport';
import {bindFramebufferInfo} from 'twgl.js';


export class PatternRunner extends RawPatternRunner {
    constructor(model, pattern, group, mapping) {
        const { renderer } = viewports.getViewport('main');
        const gl = renderer.getContext();
        super(gl, model, pattern, group, mapping);

        this.renderer = renderer;
        this.outputTexture = new THREE.Texture();
    }

    step(time) {
        const texture = super.step(time);
        const properties = this.renderer.properties.get(this.outputTexture);
        properties.__webglTexture = texture;
        properties.__webglInit = true;
        bindFramebufferInfo(this.gl, null);
        this.renderer.resetGLState();
        return this.outputTexture;
    }
}
