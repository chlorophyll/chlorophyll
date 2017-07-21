import GraphLib from 'chl/graphlib/graph';
import Units from 'chl/units';

let node_types = [];

function ConstNode() {
    let self = this;
    this.addOutput('constant', 'number');
    this.setConstant = function(constant) {
        self.properties.constant = constant;
        self.outputs[0].label = `constant (${constant})`;
    };

    self.nodePanel = function() {
        let old_constant = self.properties.constant;
        let dialog = new LiteGUI.Dialog('Constant Settings', {
            title: 'Constant Settings',
            minimize: false,
            width: 200,
            height: '6em',
            resizable: false,
            draggable: true,
            closable: false,
        });

        let inspector = new LiteGUI.Inspector('constant-settings', {
        });

        inspector.addNumber('constant', self.properties.constant, {
            callback: self.setConstant
        });

        dialog.add(inspector);

        dialog.addButton('Ok', { close: true, callback: function() {
            self.modified();
        }});
        dialog.addButton('Cancel', {
            close: true,
            callback: () => self.setConstant(old_constant)
        });
        dialog.show();
    };
    this.setConstant(0);
};

ConstNode.prototype.onExecute = function() {
    this.setOutputData(0, this.properties.constant);
};

node_types.push(['basic/constant', ConstNode]);

function IfNode() {
    this.addInput('clause', 'boolean');
    this.addInput('trueBranch');
    this.addInput('falseBranch');
    this.addOutput('result');
}

IfNode.title = 'if';

IfNode.prototype.onExecute = function() {
    let clause = this.getInputData(0);
    let trueBranch = this.getInputData(1);
    let falseBranch = this.getInputData(2);
    this.setOutputData(0, clause ? trueBranch : falseBranch);
};
node_types.push(['logic/if', IfNode]);

function EqualsNode() {
    this.addInput('a');
    this.addInput('b');
    this.addOutput('a == b', 'boolean');
}

EqualsNode.title = 'a == b';

EqualsNode.prototype.onExecute = function() {
    let a = this.getInputData(0);
    let b = this.getInputData(1);
    this.setOutputData(0, a == b);
};
node_types.push(['logic/==', EqualsNode]);

function LessNode() {
    this.addInput('a', 'number');
    this.addInput('b', 'number');
    this.addOutput('a < b', 'boolean');
}
LessNode.title = 'a < b';
LessNode.prototype.onExecute = function() {
    this.setOutputData(0, this.getInputData(0) < this.getInputData(1));
};
node_types.push(['logic/<', LessNode]);

function LessEqualNode() {
    this.addInput('a', 'number');
    this.addInput('b', 'number');
    this.addOutput('a <= b', 'boolean');
}
LessEqualNode.title = 'a <= b';
LessEqualNode.prototype.onExecute = function() {
    this.setOutputData(0, this.getInputData(0) <= this.getInputData(1));
};
node_types.push(['logic/<=', LessEqualNode]);

function GreaterNode() {
    this.addInput('a', 'number');
    this.addInput('b', 'number');
    this.addOutput('a > b', 'boolean');
}
GreaterNode.title = 'a > b';
GreaterNode.prototype.onExecute = function() {
    this.setOutputData(0, this.getInputData(0) > this.getInputData(1));
};
node_types.push(['logic/>', GreaterNode]);

function GreaterEqualNode() {
    this.addInput('a', 'number');
    this.addInput('b', 'number');
    this.addOutput('a >= b', 'boolean');
}
GreaterEqualNode.title = 'a >= b';
GreaterEqualNode.prototype.onExecute = function() {
    this.setOutputData(0, this.getInputData(0) >= this.getInputData(1));
};
node_types.push(['logic/>=', GreaterEqualNode]);

function AndNode() {
    this.addInput('a');
    this.addInput('b');
    this.addOutput('a && b', 'boolean');
}
AndNode.title = 'a && b';
AndNode.prototype.onExecute = function() {
    this.setOutputData(0, this.getInputData(0) && this.getInputData(1));
};
node_types.push(['logic/&&', AndNode]);

function OrNode() {
    this.addInput('a');
    this.addInput('b');
    this.addOutput('a || b', 'boolean');
}
OrNode.title = 'a || b';
OrNode.prototype.onExecute = function() {
    this.setOutputData(0, this.getInputData(0) || this.getInputData(1));
};
node_types.push(['logic/||', OrNode]);

function NotNode() {
    this.addInput('a');
    this.addOutput('!a', 'boolean');
}

NotNode.title = '!a';

NotNode.prototype.onExecute = function() {
    this.setOutputData(0, !this.getInputData(0));
};

node_types.push(['logic/!', NotNode]);

function AddNode() {
    this.addInput('a', Units.Numeric);
    this.addInput('b', Units.Numeric);
    this.addOutput('a + b');
}

AddNode.title = 'a + b';
AddNode.prototype.onExecute = function() {
    let a = this.getInputData(0);
    let b = this.getInputData(1);
    this.setOutputData(0, Units.Operations.add(a, b));
};
node_types.push(['math/add', AddNode]);

function SubNode() {
    this.addInput('a', Units.Numeric);
    this.addInput('b', Units.Numeric);
    this.addOutput('a - b');
}

SubNode.title = 'a - b';
SubNode.prototype.onExecute = function() {
    let a = this.getInputData(0);
    let b = this.getInputData(1);
    this.setOutputData(0, Units.Operations.sub(a, b));
};
node_types.push(['math/sub', SubNode]);

function MulNode() {
    this.addInput('a', Units.Numeric);
    this.addInput('b', Units.Numeric);
    this.addOutput('a * b');
}

MulNode.title = 'a * b';
MulNode.prototype.onExecute = function() {
    let a = this.getInputData(0);
    let b = this.getInputData(1);
    this.setOutputData(0, Units.Operations.mul(a, b));
};
node_types.push(['math/mul', MulNode]);

function AbsNode() {
    this.addInput('a', Units.Numeric);
    this.addOutput('|a|');
}

AbsNode.title = '|a|';
AbsNode.prototype.onExecute = function() {
    this.setOutputData(0, Math.abs(this.getInputData(0)));
};

node_types.push(['math/abs', AbsNode]);


function DivNode() {
    this.addInput('a', Units.Numeric);
    this.addInput('b', Units.Numeric);
    this.addOutput('a / b');
}
DivNode.title = 'a / b';
DivNode.prototype.onExecute = function() {
    let a = this.getInputData(0);
    let b = this.getInputData(1);
    this.setOutputData(0, Units.Operations.div(a, b));
};
node_types.push(['math/div', DivNode]);

function ModNode() {
    this.addInput('a', Units.Numeric);
    this.addInput('b', Units.Numeric);
    this.addOutput('a % b');
}
ModNode.title = 'a % b';
ModNode.prototype.onExecute = function() {
    let a = this.getInputData(0);
    let b = this.getInputData(1);
    this.setOutputData(0, Units.Operations.mod(a, b));
};
node_types.push(['math/mod', ModNode]);

function SineNode() {
    this.addInput('x', Units.Numeric);
    this.addOutput('sin(x)');
};
SineNode.title = 'sin(x)';
SineNode.prototype.onExecute = function() {
    let x = this.getInputData(0);
    this.setOutputData(0, Math.sin(x));
};

node_types.push(['math/sin', SineNode]);
function CosNode() {
    this.addInput('x', Units.Numeric);
    this.addOutput('cos(x)');
};
CosNode.title = 'cos(x)';
CosNode.prototype.onExecute = function() {
    let x = this.getInputData(0);
    this.setOutputData(0, Math.cos(x));
};
node_types.push(['math/cos', CosNode]);

function MapNode() {
    this.addInput('value', Units.Numeric);
    this.addInput('fromLow', Units.Numeric);
    this.addInput('fromHigh', Units.Numeric);
    this.addInput('toLow', Units.Numeric);
    this.addInput('toHigh', Units.Numeric);

    this.addOutput('result', Units.Numeric);
}

MapNode.title = 'map';
MapNode.prototype.onExecute = function() {
    let value = this.getInputData(0);
    let fromLow = this.getInputData(1);
    let fromHigh = this.getInputData(2);
    let toLow = this.getInputData(3);
    let toHigh = this.getInputData(4);

    let fromVal = Units.Operations.sub(value, fromLow);
    let toRange = Units.Operations.sub(toHigh, toLow);
    let fromRange = Units.Operations.sub(fromHigh, fromLow);

    let toVal = Units.Operations.mul(fromVal, Units.Operations.div(toRange, fromRange));
    let output = Units.Operations.add(toVal, toLow);
    this.setOutputData(0, output);
};
node_types.push(['math/map', MapNode]);

// //// organize this better...
//
function Rotate2D() {
    this.addInput('x', Units.Distance);
    this.addInput('y', Units.Distance);
    this.addInput('theta', Units.Angle);
    this.addOutput('x\'', Units.Distance);
    this.addOutput('y\'', Units.Distance);
}

Rotate2D.title = '2D rotation';
Rotate2D.prototype.onExecute = function() {
    let x = this.getInputData(0).valueOf();
    let y = this.getInputData(1).valueOf();
    let theta = this.getInputData(2).valueOf();

    let c = Math.cos(theta);
    let s = Math.sin(theta);

    let xo = x * c - y * s;
    let yo = x * s + y * c;

    this.setOutputData(0, xo);
    this.setOutputData(1, yo);
};

node_types.push(['2d/rotate', Rotate2D]);

export default function register_pattern_nodes() {
    GraphLib.registerNodeTypes(node_types);
};

