<template>
    <div>
    <h1> Welcome to Chlorophyll</h1>
    <ul>
    <li>Project: {{ name }}</li>
    <li>Strips attached: {{ strips_attached }}</li>
    <li>{{ connected_msg }}</li>
    </ul>
    <select v-model="cur_pattern_id">
        <template v-for="pattern in patterns">
            <option :value="pattern.id">{{ pattern.name }}</option>
        </template>
    </select>
    <select v-model="cur_mapping_id">
        <template v-for="mapping in valid_mappings">
            <option :value="mapping.id">{{ mapping.name }}</option>
        </template>
    </select>
    <button @click="play" :disabled="!ready">Run</button>
    <button @click="off">Off</button>
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
            cur_pattern_id: null,
            cur_mapping_id: null,
            mappings: [],
            patterns: [],
            model: {},
            name: '',
        };
    },
    created() {
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
            this.model = resp.data.model;
            this.name = resp.data.name;
        });
    },
    watch: {
        valid_mappings() {
            let idx = this.valid_mappings.findIndex(({id}) => id == this.cur_mapping_id);

            if (idx == -1) {
                this.cur_mapping_id = null;
            }
        }
    },
    methods: {
        play() {
            axios.post('http://localhost:8080/play', {
                pattern: this.cur_pattern_id,
                mapping: this.cur_mapping_id,
            }).then((resp) => {
                //vov
            });
        },
        off() {
            axios.post('http://localhost:8080/off');
        }
    },
    computed: {
        connected_msg() {
            return this.connected ? 'Connected' : 'Not connected';
        },
        cur_pattern() {
            if (this.cur_pattern_id == null)
                return null;
            return this.patterns[this.cur_pattern_id];
        },
        valid_mappings() {
            if (this.cur_pattern == null)
                return [];

            return Object.values(this.mappings).filter(
                (mapping) => mapping.type == this.cur_pattern.mapping_type
            )
        },

        num_strips() {
            return this.model.strip_offsets.length - 1;
        },

        ready() {
            return (this.cur_pattern_id !== null
                 && this.cur_mapping_id !== null
                 && this.strips_attached >= this.num_strips);
        }
    }
}
</script>
