import { mappingTypes } from '@/common/mapping';

import GraphLib, { GraphNode } from '@/common/graphlib';


function make_nodes(mapping_name, coord_types) {
    let node_types = [];
    for (let coord_name in coord_types) {
        const info = coord_types[coord_name];
        const path = `mapping/${mapping_name}/${coord_name}`;
        let MapInputNode = class extends GraphNode {
            constructor(options) {
                const inputs = [];
                const outputs = info.coords.map((c) => GraphNode.output(c.name, c.unit));

                outputs.push(GraphNode.output('color', 'CRGB'));

                super(options, inputs, outputs, {
                    config: {
                        color: '#7496a6',
                        boxcolor: '#69a4bf',
                        removable: false,
                    }
                });
            }
            onExecute() {
                let coords = this.graph.getGlobalInputData('coords');


                for (let i = 0; i < info.coords.length; i++) {
                    let in_val = coords[i];
                    this.setOutputData(i, in_val);
                }
                let color = this.graph.getGlobalInputData('color');
                this.setOutputData(info.coords.length, color);
            }
        };
        node_types.push([path, MapInputNode]);
    }
    return node_types;
}

export default function register_mapping_nodes() {
    for (let name in mappingTypes) {
        let coord_types = mappingTypes[name].coord_types;
        GraphLib.registerNodeTypes(make_nodes(name, coord_types));
    }
}

