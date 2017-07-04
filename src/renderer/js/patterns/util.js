import GraphLib from 'chl/graphlib/graph';

// Structural node types for the pattern graph
function OutputColor() {
    this.addInput('outcolor', 'CRGB');
}

OutputColor.prototype.onAdded = function() {
    this.graph.addGlobalOutput('outcolor');
};

OutputColor.prototype.onExecute = function() {
    this.graph.setGlobalOutputData('outcolor', this.getInputData(0));
};

OutputColor.title = 'Output Color';
OutputColor.visible_stages = [];
OutputColor.prototype.color = '#e5a88a';
OutputColor.prototype.boxcolor = '#cc8866';
OutputColor.prototype.removable = false;

GraphLib.registerNodeType('lowlevel/output/color', OutputColor);

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
for (type in MappingInputs) {
    let info = MappingInputs[type];

    let map_input_node = function() {
        for (let i = 0; i < info.coords.length; i++) {
            this.addOutput(info.coords[i].name, info.coords[i].unit);
        }
        this.addOutput('color', 'CRGB');
    };

    map_input_node.prototype.onExecute = function() {
        let coords = this.graph.getGlobalInputData('coords');

        for (let i = 0; i < info.coords.length; i++) {
            let in_val = coords[i];
            let unitConstructor = info.coords[i].unit;

            this.setOutputData(i, new unitConstructor(in_val));
        }
        let color = this.graph.getGlobalInputData('color');
        this.setOutputData(info.coords.length, color);
    };

    map_input_node.title = info.name + 'Input';
    map_input_node.visible_stages = [];

    map_input_node.prototype.color = '#7496a6';
    map_input_node.prototype.boxcolor = '#69a4bf';
    map_input_node.prototype.removable = false;

    GraphLib.registerNodeType('lowlevel/input/' + type, map_input_node);
}


function TimeInput() {
    this.addOutput('t', Units.Numeric);
}
TimeInput.prototype.onExecute = function() {
    this.setOutputData(0, this.graph.getGlobalInputData('t'));
};
TimeInput.title = 'TimeInput';
GraphLib.registerNodeType('lowlevel/input/time', TimeInput);

function PrecomputeOutput() {
    this.addProperty('name', null);
}

PrecomputeOutput.prototype.onAdded = function() {
    let self = this;
    LiteGUI.prompt('name', function(v) {
        self.addInput(v);
        self.properties['name'] = v;
        self.graph.addGlobalOutput(v);
    });
};

PrecomputeOutput.prototype.onExecute = function() {
    this.graph.setGlobalOutputData(this.properties['name'], this.getInputData(0));
};

PrecomputeOutput.visible_stages = ['precompute'];
PrecomputeOutput.title = 'Precompute Output';

GraphLib.registerNodeType('lowlevel/output/value', PrecomputeOutput);
