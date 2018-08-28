<template>
    <plotter v-if="!has_dynamic_props"
             :samples="samples" :sample-domain="sampleDomain" :width="width" :height="height" />
</template>

<script>
import Plotter from '@/components/widgets/plotter';

import Range from '@/common/util/range';
import Frequency from '@/common/nodes/oscillators/util';

import * as glsl from '@/common/glsl';

import glslTranspiler from 'glsl-transpiler';


function transpile(ret, funcname, args, body) {
    const transpiler = glslTranspiler();
    const ast = glsl.FunctionDecl(ret, funcname, args, body);
    const source = glsl.generate(ast);
    const result = `${transpiler.compile(source)}\nreturn ${funcname}`;
    const fn = Function(result)();
    return fn;
}

export default {
    name: 'oscillator-plotter',
    props: ['node', 'width', 'height'],
    components: { Plotter },
    computed: {
        has_dynamic_props() {
            return this.node.inputs.some((slot) => slot.state.num_edges > 0);
        },
        framerate() {
            return 100;
        },
        new_phase() {
            return transpile('float', 'new_phase', [
                glsl.InParam('float', 'cur_phase'),
                glsl.InParam(Frequency.declare().type, 'frequency')
            ], [
                glsl.Return(this.node.graph_node.new_phase(
                    glsl.Ident('cur_phase'),
                    glsl.Ident('frequency'),
                    this.framerate,
                ))
            ]);
        },
        value() {
            return transpile('float', 'v', [
                glsl.InParam('float', 'cur_phase'),
                glsl.InParam(Range.declare().type, 'amplitude'),
                glsl.InParam('float', 'phase_offset'),
            ], [
                glsl.Return(this.node.graph_node.value(
                    glsl.Ident('cur_phase'),
                    glsl.Ident('amplitude'),
                    glsl.Ident('phase_offset'),
                ))
            ]);
        },
        sampleDomain() {
            return [0, 3];
        },
        samples() {
            const { frequency, amplitude, phase: offset } = this.node.defaults;
            let f = frequency;

            let cur_phase = 0;
            const [start, end] = this.sampleDomain;
            const samples = [];
            for (let x = start; x < end; x += 1/this.framerate) {
                samples.push({
                    x,
                    y: this.value(cur_phase, amplitude.valueOf(), offset)
                });
                cur_phase = this.new_phase(cur_phase, f.valueOf()) % 1;
            }
            return samples;
        },
    },
};
</script>
