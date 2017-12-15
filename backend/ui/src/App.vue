<template>
    <div>
    <h1> Welcome to Chlorophyll</h1>
    <ul>
    <li>Project: {{ name }}</li>
    <li>Strips attached: {{ strips_attached }}</li>
    <li>{{ connected_msg }}
        <span v-if="!connected"><button @click="connect">Try to connect</button> (can't be bothered to write autoretry)</span>
    </li>
    </ul>
    <div v-for="(clip, idx) in sequence">
        <select v-model="clip.pattern_id">
            <template v-for="pattern in patterns">
                <option :value="pattern.id">{{ pattern.name }}</option>
            </template>
        </select>
        <select v-model="clip.mapping_id">
            <template v-for="mapping in valid_mappings(clip.pattern_id)">
                <option :value="mapping.id">{{ mapping.name }}</option>
            </template>
        </select>
        <label :for="`playtime${idx}`">Time:</label>
        <input :id="`playtime${idx}`" type="number" v-model.number="clip.time" />
        <button @click="deleteClip(idx)">X</button>
    </div>
    <div>
        <button @click="newClip">Add clip</button>
        <button @click="save">Save seq to disk</button>
        <button @click="clear">Clear seq on disk</button>
    </div>
    <div>
        <button @click="play" :disabled="!ready">Run</button>
        <button @click="off">Off</button>
    </div>
    </div>
</template>

<script>
import axios from 'axios';

export default {
    data() {
        return {
            connected: false,
            socket: null,
            strips_attached: 0,
            sequence: [],
            mappings: [],
            patterns: [],
            model: {},
            name: '',
        };
    },
    created() {
        this.connect();
    },
    watch: {
        valid_mappings() {
            this.sequence = this.sequence.map((clip) => {
                let idx = this.valid_mappings(clip.pattern_id)
                    .findIndex(({id}) => id === clip.mapping_id);

                if (idx == -1) {
                    clip.mapping_id = null;
                }
            });
        }
    },
    methods: {
        play() {
            axios.post('http://localhost:8080/play', {
                sequence: this.sequence,
                xfade: 5
            }).then((resp) => {
                //vov
            });
        },
        off() {
            axios.post('http://localhost:8080/off');
        },
        save() {
            axios.post('http://localhost:8080/save', this.sequence);
        },
        clear() {
            this.sequence = [];
            this.save();
        },
        valid_mappings(pattern_id) {
            if (pattern_id === null)
                return [];

            const pattern = this.patterns[pattern_id];
            return Object.values(this.mappings).filter((mapping) =>
                mapping.type === pattern.mapping_type
            );
        },
        newClip() {
            this.sequence.push({
                pattern_id: null,
                mapping_id: null,
                time: 300
            });
        },
        deleteClip(i) {
            this.sequence.splice(i, 1);
        },

        connect() {
            this.socket = new WebSocket('ws://localhost:8080');
            this.socket.onopen = (event) => {
                this.connected = true;
            }

            this.socket.onclose = (event) => {
                this.connected = false;
            }

            this.socket.onmessage = (event) => {
                this.strips_attached = JSON.parse(event.data)['strips-attached'];
            }
            axios.get('http://localhost:8080/info').then((resp) => {
                this.mappings = resp.data.mappings;
                this.patterns = resp.data.patterns;
                this.sequence = resp.data.sequence || [];
                this.model = resp.data.model;
                this.name = resp.data.name;
            });

        },
    },
    computed: {
        connected_msg() {
            return this.connected ? 'Connected' : 'Not connected';
        },
        cur_patterns() {
            return this.sequence.map(clip => {
                if (clip.pattern_id == null)
                    return null;

                return this.patterns[clip.pattern_id];
            });
        },

        num_strips() {
            let strip_offsets = this.model.strip_offsets || [0];
            return strip_offsets.length - 1;
        },

        ready() {
            return (this.cur_pattern_id !== null
                 && this.cur_mapping_id !== null
                 && this.strips_attached >= this.num_strips);
        }
    }
}
</script>
