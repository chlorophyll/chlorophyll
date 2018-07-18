<template>
    <plotter v-if="!has_dynamic_props"
             :func="func" :width="width" :height="height" />
</template>

<script>
import Plotter from '@/components/widgets/plotter';

import Range from '@/common/util/range';
import Frequency from '@/common/nodes/oscillators/util';

import * as glsl from '@/common/glsl';

import glslTranspiler from 'glsl-transpiler';

export default {
    name: 'oscillator-plotter',
    props: ['node', 'width', 'height'],
    components: { Plotter },
    data() {
        return {
            func: this.makeFunction()
        };
    },
    watch: {
        'node.defaults': {
            handler() {
                this.func = this.makeFunction();
            },
            deep: true,
        }
    },
    computed: {
        has_dynamic_props() {
            return this.node.inputs.some((slot) => slot.state.num_edges > 0);
        },
    },
    methods: {
        makeFunction() {
            const { frequency, amplitude, phase } = this.node.defaults;
            let func = glsl.FunctionDecl('float', 'waveform', [
                glsl.InParam(Frequency.declare().type, 'frequency'),
                glsl.InParam(Range.declare().type, 'amplitude'),
                glsl.InParam('float', 'time'),
            ], [
                glsl.Return(this.node.graph_node.waveform(
                    glsl.Ident('frequency'),
                    glsl.Ident('amplitude'),
                    glsl.Ident('time')
                ))
            ]);

            let out = glsl.generate(func);

            let transpiler = glslTranspiler();
            let result = transpiler.compile(out);
            result += '\nreturn waveform;';
            let fn = new Function('_', result)();
            return (t) => {
                const phased_t = t + phase * frequency.sec;
                return fn(frequency.valueOf(), amplitude.valueOf(), phased_t);
            };
        },
    }

};
</script>
