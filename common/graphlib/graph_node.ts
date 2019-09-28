import * as Serialization from '../util/serialization';

const DEFAULT_CONFIG = {
    color: '#999',
    bgcolor: '#444',
    boxcolor: '#aef',
    removable: true,
};

export default class GraphNode {
    public id;
    public graph;
    public input_info;
    public output_info;
    public path;
    public vm; // Vue viewmodel

    // `state` is programmatically set stuff that should be reactive
    // `settings` is user-controllable stuff that should be reactive
    // other fields are not reactive
    static input(name, type) {
        return {
            name,
            type,
            state: {num_edges: 0},
            settings: {label: null, autoconvert: true, read_only: false}
        };
    }

    static output(name, type) {
        return {
            name,
            type,
            state: {num_edges: 0},
            settings: {label: null}
        };
    }

    // User-facing config values not used by shaders themselves
    static parameter(name, type, value) {
        return {
            name,
            type,
            value,
        };
    }

    static getInputs() {
        return [];
    }
    static getOutputs() {
        return [];
    }

    constructor(options, {config = {}} = {}) {
        const {
            graph,
            id,
            title,
            pos,
            path,
            parameters = [],
            properties = {},
            vm_factory
        } = options;

        const inputs = (this.constructor as any).getInputs();
        const outputs = (this.constructor as any).getOutputs();

        this.graph = graph;
        this.id = id;
        this.path = path;

        const input_vm = inputs.map(({ state, settings }) => ({state, settings}));
        const output_vm = outputs.map(({ state, settings }) => ({state, settings}));

        this.input_info = inputs.map(({name, type}) => ({name, type, src: null}));
        this.output_info = outputs.map(({name, type}) => ({name, type}));

        // Config values for default inputs / graph-typed values
        const defaults = {};
        inputs.forEach(input => {
            if (input.name in properties)
                defaults[input.name] = properties[input.name];
        });


        let cfg = {...DEFAULT_CONFIG, ...config};

        this.vm = vm_factory(graph, this, {
            title,
            pos,
            inputs: input_vm,
            outputs: output_vm,
            parameters,
            defaults,
            config: cfg
        });
    }

    /*
     * Update partial node configuration
     */
    updateIOConfig(inputs, outputs) {
        if (inputs) {
            this.input_info = inputs.map(({name, type}) => ({name, type, src: null}));
            const old_states = this.vm.inputs.map(({state}) => state);
            for (const [i, state] of old_states.entries()) {
                inputs[i].state = state;
            }
            this.vm.inputs = inputs.map(({ state, settings }) => ({state, settings}));
        }

        if (outputs) {
            this.output_info = outputs.map(({name, type}) => ({name, type}));
            const old_states = this.vm.outputs.map(({state}) => state);
            for (const [i, state] of old_states.entries()) {
                outputs[i].state = state;
            }
            this.vm.outputs = outputs.map(({ state, settings }) => ({state, settings}));
        }
    }

    /*
     * To be overridden by the node, if needed.
     * Will be called after any properties or defaults for the node are changed.
     */
    onPropertyChange() {
    }

    defaultForSlot(slot) {
        const { name } = this.input_info[slot];
        return this.vm.defaults[name];
    }

    setPosition(x, y) {
        this.vm.pos = [x, y];
    }

    save() {
        const data = {
            id: this.id,
            pos: [...this.vm.pos],
            title: this.vm.title,
            type: this.path,
            input_settings: this.vm.inputs.map(({settings}) => ({...settings})),
            output_settings: this.vm.outputs.map(({settings})=> ({...settings})),
            defaults: Serialization.save(this.vm.defaults),
            parameters: Serialization.save(this.vm.parameters),
            color: this.vm.config.color,
            boxcolor: this.vm.config.boxcolor,
        };

        return Object.freeze(data);
    }

    restore_settings(nodesnap) {
        for (let i = 0; i < this.vm.inputs.length; i++) {
            this.vm.inputs[i].settings = nodesnap.input_settings[i];
        }
        for (let i = 0; i < this.vm.outputs.length; i++) {
            this.vm.outputs[i].settings = nodesnap.output_settings[i];
        }
        if (nodesnap.color) {
            this.vm.config.color = nodesnap.color;
        }
        if (nodesnap.boxcolor) {
            this.vm.config.boxcolor = nodesnap.boxcolor;
        }
        this.vm.defaults = Serialization.restore(nodesnap.defaults);
        this.vm.parameters = Serialization.restore(nodesnap.parameters) || [];

        // Make sure any parameterized node configuration is recalculated on load
        this.onPropertyChange();
    }
}

