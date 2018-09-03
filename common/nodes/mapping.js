import { mappingTypes } from '@/common/mapping';
import GraphLib, { GraphNode } from '@/common/graphlib';
import * as glsl from '@/common/glsl';

function make_nodes(mappingName, mappingType) {
    return Object.entries(mappingType.coord_types).map(([coordName, coordCfg]) => {
        const path = `mapping/${mappingName}/${coordName}`;

        const MapInputNode = class extends GraphNode {
            constructor(options) {
                const inputs = [];
                const outputs = coordCfg.coords.map((c) => GraphNode.output(c.name, c.unit));

                outputs.push(GraphNode.output('color', 'CRGB'));

                super(options, inputs, outputs, {
                    config: {
                        color: '#7496a6',
                        boxcolor: '#69a4bf',
                        removable: false,
                    }
                });
            }

            compile(c) {
                const coordValue = c.getGlobalInput('coords');

                const swizzle = mappingType.glsl_swizzle;
                if (!swizzle || swizzle.length === 1) {
                    c.setOutput(this, 0, coordValue);
                } else {
                    const fields = Array.from(mappingType.glsl_swizzle);
                    fields.forEach((field, i) => {
                        c.setOutput(this, i, glsl.Dot(coordValue, field));
                    });
                }

                let color = c.getGlobalInput('color');
                c.setOutput(this, coordCfg.coords.length, color);
            }
        };

        return [path, MapInputNode];
    });
}

export default function register_mapping_nodes() {
    Object.entries(mappingTypes).forEach(([name, mapType]) => {
        GraphLib.registerNodeTypes(make_nodes(name, mapType));
    });
}

