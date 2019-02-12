import * as THREE from 'three';
import RawPatternRunner from '@/common/patterns/runner';
import {createFromConfig} from '@/common/mapping';
import viewports from 'chl/viewport';
import {bindFramebufferInfo} from 'twgl.js';

const GRAPH_EVENTS = [
    'node-removed',
    'node-added',
    'node-property-changed',
    'node-default-added',
    'edge-removed',
    'edge-added',
];

export class PatternRunner extends RawPatternRunner {
    constructor(model, pattern, group, mapping) {
        const { renderer } = viewports.getViewport('main');
        const gl = renderer.getContext();
        const pixelMapping = createFromConfig(mapping);

        super(gl, model, pattern, group, pixelMapping);

        for (const event of GRAPH_EVENTS) {
            this.graph.addEventListener(event, () => this.refresh(event));
        }

        this.renderer = renderer;
        this.outputTexture = new THREE.Texture();
    }

    refresh(event) {
        setImmediate(() => super.refresh(event));
    }

    detach() {
        for (const event of GRAPH_EVENTS) {
            this.graph.removeEventListener(event, this.refresh);
        }
        super.detach();
    }

    step(time, pixels) {
        const texture = super.step(time, pixels);
        const properties = this.renderer.properties.get(this.outputTexture);
        properties.__webglTexture = texture;
        properties.__webglInit = true;
        bindFramebufferInfo(this.gl, null);
        this.renderer.state.reset();
        return this.outputTexture;
    }
}
