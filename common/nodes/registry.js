import * as assert from 'assert';

import patternNodes from './pattern';
import pixelStageNodes from './pixel_stage';
import oscillatorNodes from './oscillators';
import crgbNodes from './color';
import mappingNodes from './mapping';
import signalNodes from './signals';
import syphonNodes from './syphon';
import videoNodes from './video';
import easingNodes from './easing';
import noiseNodes from './noise';
import complexNodes from './complex';

const staticNodes = [
    crgbNodes,
    mappingNodes,
    patternNodes,
    pixelStageNodes,
    oscillatorNodes,
    complexNodes,
    syphonNodes,
    videoNodes,
    easingNodes,
    noiseNodes,
];

const generatedNodes = [
    {
        register: signalNodes,
        getDeps: d => d.signals
    }
];

let registered = false;

export function refreshFromStore(vuexStore) {
    assert.ok(vuexStore);
    assert.ok(vuexStore.getters);

    const deps = {
        signals: vuexStore.getters['signal/signal_list'] || [],
    };

    return refreshNodes(deps);
};

export function refreshFromSavedState(state) {
    assert.ok(state);
    const deps = {
        signals: state.signals || [],
    };

    return refreshNodes(deps);
};

function refreshNodes(deps) {
    assert.ok(deps);

    // First, regenerate any dynamically generated nodes.
    // Always refresh these nodes when calculating the list, in case the backing state changed.
    for (const {register, getDeps} of generatedNodes) {
        const nodeDeps = getDeps(deps);
        register(nodeDeps);
    }

    if (registered)
        return;

    // Statically defined nodes: These only need to be registered once.
    for (const register of staticNodes) {
        register();
    }

    registered = true;
};
