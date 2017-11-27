<template><div id="sequencer" class="panel">

<select v-model="selected_clip">
    <option disabled value="">Select clip:</option>
    <option v-for="clip in clips" v-bind:value="clip">
        {{ clip.name }}
    </option>
</select>
<div v-if="selected_clip !== null" id="clip-config-panel">
    <div v-for="(assmt, idx) in assigned_patterns" class="clip-assign-row">
        <button @click="assigned_patterns.splice(idx, 1)" class="material-icons">
            remove
        </button>
        <select v-model="assmt.mapping" class="clipassign-select">
            <option disabled value="">Select mapping</option>
            <option v-for="map in listMappings()" v-bind:value="map.mapping">
                {{ map.title }}
            </option>
        </select>
        <select v-model="assmt.pattern" class="clip-assign-select">
            <option disabled value="">Select pattern</option>
            <option v-for="pat in listPatterns()" v-bind:value="pat.pattern">
                {{ pat.title }}
            </option>
        </select>
    </div>
    <div class="clipassign-row">
        <button @click="addAssignment()" class="material-icons">add</button>
    </div>
    <div class="clip-properties">
        <!-- TODO -->
    </div>
</div>
<div v-else class="text-placeholder">
    Select an clip to edit.
</div>

</div></template>

<script>
import Clip from 'chl/sequencer/clip';
import store, { newgid } from 'chl/vue/store';

export default {
    name: 'clip-editor',
    store,
    props: ['mappings'],
    data() {
        return {
            selected_clip: null,
            // id -> object mapping
            clips: {
                '1': {
                    name: 'some clip',
                    assigned_patterns: []
                },
                '2': {
                    name: 'another clip',
                    assigned_patterns: []
                },
            },
            assigned_patterns: []
        };
    },
    watch: {
        assigned_patterns(newassmts, oldassmts) {
            if (this.selected_clip !== null)
                this.selected_clip.assigned_patterns = newassmts;
        },
        selected_clip(newclip, oldclip) {
            if (newclip !== null)
                this.assigned_patterns = newclip.assigned_patterns;
        }
    },
    methods: {
        createClip() {
            const id = newgid();
            let clip = new Clip(id);
            this.clips[id] = clip;
        },
        // TODO these should eventually be computed properties from global store
        listMappings() {
        },
        listPatterns() {
        },
        addAssignment() {
            if (this.selected_clip === null) {
                console.error('No clip to add to!');
                return;
            }
            this.assigned_patterns.push({
                mapping: null,
                pattern: null
            });
        }
    }
};
</script>

<style>
</style>
