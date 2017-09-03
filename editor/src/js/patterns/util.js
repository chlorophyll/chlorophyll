import { GraphLib, GraphNode } from 'chl/graphlib/graph';
import Units from 'chl/units';
import LiteGUI from 'chl/litegui';

let node_types = [];

// Structural node types for the pattern graph

class OutputColor extends GraphNode {
    constructor(options) {
        const inputs = [GraphNode.input('outcolor', 'CRGB')];
        const outputs = [];
        super(options, inputs, outputs, {
            config: {
                color: '#e5a88a',
                boxcolor: '#cc8866',
                removable: false,
            }
        });
    }

    onExecute() {
        this.graph.setGlobalOutputData('outcolor', this.getInputData(0));
    }
}

OutputColor.title = 'Output Color';

node_types.push(['lowlevel/output/color', OutputColor]);

export const MappingInputs = {
    cartesian2d: {
        name: 'Cartesian2D',
        coords: [
            {name: 'x', unit: Units.Distance},
            {name: 'y', unit: Units.Distance}
        ]
    },
    polar2d: {
        name: 'Polar2D',
        coords: [
            {name: 'r', unit: Units.Percentage},
            {name: 'theta', unit: Units.Angle}
        ]
    },
    cartesian3d: {
        name: 'Cartesian3D',
        coords: [
            {name: 'x', unit: Units.Distance},
            {name: 'y', unit: Units.Distance},
            {name: 'z', unit: Units.Distance}
        ]
    },
    cylinder3d: {
        name: 'Cylindrical3D',
        coords: [
            {name: 'r', unit: Units.Percentage},
            {name: 'theta', unit: Units.Angle},
            {name: 'z', unit: Units.Distance}
        ]
    },
    sphere3d: {
        name: 'Spherical3D',
        coords: [
            {name: 'r', unit: Units.Percentage},
            {name: 'theta', unit: Units.Angle},
            {name: 'phi', unit: Units.Angle}
        ]
    }
};

/*
 * Generate input nodes for each mapping type
 */
for (let type in MappingInputs) {
    if (MappingInputs[type] === undefined)
        continue;
    let info = MappingInputs[type];

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
                let UnitConstructor = info.coords[i].unit;

                this.setOutputData(i, new UnitConstructor(in_val));
            }
            let color = this.graph.getGlobalInputData('color');
            this.setOutputData(info.coords.length, color);
        }
    };

    node_types.push(['lowlevel/input/' + type, MapInputNode]);
}


class TimeInput extends GraphNode {
    constructor(options) {
        const outputs = [GraphNode.output('t', Units.Numeric)];
        const inputs = [];
        super(options, inputs, outputs);
    }

    onExecute() {
        this.setOutputData(0, this.graph.getGlobalInputData('t'));
    }
};

TimeInput.title = 'TimeInput';

export default function register_util_nodes() {
    GraphLib.registerNodeTypes(node_types);
};
