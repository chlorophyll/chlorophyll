<template><div id="sequencer" class="litepanel">

<select v-model="selected_anim">
    <option disabled value="">Select animation:</option>
    <option v-for="anim in animations" v-bind:value="anim">
        {{ anim.name }}
    </option>
</select>
<div v-if="selected_anim !== null" id="anim-config-panel">
    <div v-for="(assmt, idx) in assigned_patterns" class="anim-assign-row">
        <button @click="assigned_patterns.splice(idx, 1)" class="material-icons">
            remove
        </button>
        <select v-model="assmt.mapping" class="animassign-select">
            <option disabled value="">Select mapping</option>
            <option v-for="map in listMappings()" v-bind:value="map.mapping">
                {{ map.title }}
            </option>
        </select>
        <select v-model="assmt.pattern" class="anim-assign-select">
            <option disabled value="">Select pattern</option>
            <option v-for="pat in listPatterns()" v-bind:value="pat.pattern">
                {{ pat.title }}
            </option>
        </select>
    </div>
    <div class="animassign-row">
        <button @click="addAssignment()" class="material-icons">add</button>
    </div>
    <div class="anim-properties">
        <!-- TODO -->
    </div>
</div>
<div v-else class="text-placeholder">
    Select an animation to edit.
</div>

</div></template>

<script>
import Animation from 'chl/sequencer/animation';
import store, { newgid } from 'chl/vue/store';

export default {
    name: 'animation-editor',
    store,
    props: ['mappings'],
    data() {
        return {
            selected_anim: null,
            // id -> object mapping
            animations: {
                '1': {
                    name: 'some animation',
                    assigned_patterns: []
                },
                '2': {
                    name: 'another animation',
                    assigned_patterns: []
                },
            },
            assigned_patterns: []
        };
    },
    watch: {
        assigned_patterns(newassmts, oldassmts) {
            if (this.selected_anim !== null)
                this.selected_anim.assigned_patterns = newassmts;
        },
        selected_anim(newanim, oldanim) {
            if (newanim !== null)
                this.assigned_patterns = newanim.assigned_patterns;
        }
    },
    methods: {
        createAnimation() {
            const id = newgid();
            let anim = new Animation(id);
            this.animations[id] = anim;
        },
        /*
        // TODO these should eventually be computed properties from global store
        listMappings() {
            return groupManager.listMappings();
        },
        listPatterns() {
            let pattern_list = [];
            patternManager.patterns.forEach((pattern, id) => {
                pattern_list.push({
                    title: pattern.name,
                    pattern: pattern
                });
            });

            return pattern_list;
        },
        addAssignment() {
            if (this.selected_anim === null) {
                console.error('No animation to add to!');
                return;
            }
            this.assigned_patterns.push({
                mapping: null,
                pattern: null
            });
        }
        */
    }
};
/*
 * Where do we store data?
 * - watchers make necessary delete/cleanup/etc. calls
 */
</script>

<style>
</style>
