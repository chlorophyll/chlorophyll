import { mappingTypes } from '@/common/mapping';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';

function make_nodes(Mapping) {
    return Mapping.views.map(mappingView => {
        const path = `mapping/${Mapping.className}/${mappingView.className}`;


        const MapInputNode = class extends GraphNode {
            static getOutputs() {
                return [
                    ...mappingView.coords.map((c) => GraphNode.output(c.name, c.unit)),
                    GraphNode.output('color', 'CRGB'),
                ];
            }
            constructor(options) {
                super(options, {
                    config: {
                        color: '#7496a6',
                        boxcolor: '#69a4bf',
                        removable: false,
                    }
                });
            }

            compile(c) {
                const coordValue = c.getGlobalInput('coords');

                const swizzle = mappingView.glslSwizzle;
                if (!swizzle || swizzle.length === 1) {
                    c.setOutput(this, 0, coordValue);
                } else {
                    const fields = Array.from(mappingView.glslSwizzle);
                    fields.forEach((field, i) => {
                        c.setOutput(this, i, glsl.Dot(coordValue, field));
                    });
                }

                let color = c.getGlobalInput('color');
                c.setOutput(this, mappingView.coords.length, color);
            }
        };

        return [path, MapInputNode];
    });
}

export default function register_mapping_nodes() {
    Object.entries(mappingTypes).forEach(([key, Mapping]) => {
        GraphLib.registerNodeTypes(make_nodes(Mapping));
    });
}

