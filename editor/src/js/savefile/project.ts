/**
 * Initialization methods for loading, creating, and managing project state.
 * Containts "stock" setup methods for provided example resources and values.
 *
 * TODO: Make this the primary interface for savefile operations
 * TODO: Trigger events on project load/save instead of needing to call
 *       createStockResources in exactly the right places
 * TODO: Track project dirty/saved status and handle autosaving
 */
import {OSCType} from '@/common/osc/osc_types';
import {createNewSignal} from 'chl/signal';
import {watchMediaFiles} from 'chl/media';

export function createStockResources(store, path) {
    // Add a few basic OSC signals if none exist yet.
    if (store.getters['signal/signal_list'].length === 0) {
        createNewSignal('Intensity', '/chlorophyll/intensity', [OSCType.FLOAT32]);
        createNewSignal('BPM', '/chlorophyll/tempo', [OSCType.FLOAT32]);
        createNewSignal('Color A', '/chlorophyll/color_a', [OSCType.COLOR]);
        createNewSignal('Color B', '/chlorophyll/color_b', [OSCType.COLOR]);
        createNewSignal('TouchOSC Fader 1', '/1/fader1', [OSCType.FLOAT32]);
        createNewSignal('TouchOSC Fader 2', '/1/fader2', [OSCType.FLOAT32]);
    }

    watchMediaFiles(store, path);
}
