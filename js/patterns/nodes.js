function Constant()
{
	this.addOutput("value","number");
	this.addProperty( "value", 1 );
}

Constant.title = "const";
Constant.desc = "Constant value";

Constant.prototype.setValue = function(v)
{
	if( typeof(v) == "string") v = parseInt(v);
	this.properties["value"] = v;
	this.setDirtyCanvas(true);
};

Constant.prototype.onExecute = function()
{
	this.setOutputData(0, this.properties["value"] );
}

Constant.prototype.onDblClick = function(e) {
	var self = this;
	LiteGUI.prompt("value", function(v) {
		self.setValue(v);
	});
}

Constant.prototype.onDrawBackground = function(ctx)
{
	//show the current value
	this.outputs[0].label = ''+this.properties["value"];
}

LiteGraph.registerNodeType("basic/const", Constant);

function LogNode() {
	this.addInput('val');
}

LogNode.prototype.onExecute = function() {
	console.log(this.getInputData(0));
}

LogNode.title = 'log'

LiteGraph.registerNodeType("basic/log", LogNode);

function IfNode() {
	this.addInput('clause', 'boolean');
	this.addInput('trueBranch');
	this.addInput('falseBranch');
	this.addOutput('result');
}

IfNode.title = 'if'

IfNode.prototype.onExecute = function() {
	var clause = this.getInputData(0);
	var trueBranch = this.getInputData(1);
	var falseBranch = this.getInputData(2);
	this.setOutputData(0, clause ? trueBranch : falseBranch);
}
LiteGraph.registerNodeType("logic/if", IfNode);

function EqualsNode() {
	this.addInput('a');
	this.addInput('b');
	this.addOutput('a == b', 'boolean');
}

EqualsNode.title = 'a == b'

EqualsNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a == b);
}
LiteGraph.registerNodeType("logic/==", EqualsNode);

function LessNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('a < b', 'boolean');
}
LessNode.title = 'a < b'
LessNode.prototype.onExecute = function() {
	this.setOutputData(0, this.getInputData(0) < this.getInputData(1));
}
LiteGraph.registerNodeType("logic/<", LessNode);

function LessEqualNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('a <= b', 'boolean');
}
LessEqualNode.title = 'a <= b'
LessEqualNode.prototype.onExecute = function() {
	this.setOutputData(0, this.getInputData(0) <= this.getInputData(1));
}
LiteGraph.registerNodeType("logic/<=", LessEqualNode);

function GreaterNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('a > b', 'boolean');
}
GreaterNode.title = 'a > b'
GreaterNode.prototype.onExecute = function() {
	this.setOutputData(0, this.getInputData(0) > this.getInputData(1));
}
LiteGraph.registerNodeType("logic/>", GreaterNode);

function GreaterEqualNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('a >= b', 'boolean');
}
GreaterEqualNode.title = 'a >= b'
GreaterEqualNode.prototype.onExecute = function() {
	this.setOutputData(0, this.getInputData(0) >= this.getInputData(1));
}
LiteGraph.registerNodeType("logic/>=", GreaterEqualNode);

function AndNode() {
	this.addInput('a');
	this.addInput('b');
	this.addOutput('a && b', 'boolean');
}
AndNode.title = 'a && b'
AndNode.prototype.onExecute = function() {
	this.setOutputData(0, this.getInputData(0) && this.getInputData(1));
}
LiteGraph.registerNodeType("logic/&&", AndNode);

function OrNode() {
	this.addInput('a');
	this.addInput('b');
	this.addOutput('a || b', 'boolean');
}
OrNode.title = 'a || b'
OrNode.prototype.onExecute = function() {
	this.setOutputData(0, this.getInputData(0) || this.getInputData(1));
}
LiteGraph.registerNodeType("logic/||", OrNode);

function NotNode() {
	this.addInput('a');
	this.addOutput('!a', 'boolean');
}

NotNode.title = '!a';

NotNode.prototype.onExecute = function() {
	this.setOutputData(0, !this.getInputData(0));
}

LiteGraph.registerNodeType("logic/!", NotNode);

function AddNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('a + b', 'number');
}

AddNode.title = 'a + b';
AddNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a+b);
}
LiteGraph.registerNodeType("math/add", AddNode);

function SubNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('a - b', 'number');
}

SubNode.title = 'a - b';
SubNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a-b);
}
LiteGraph.registerNodeType("math/sub", SubNode);

function MulNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('a * b', 'number');
}

MulNode.title = 'a * b';
MulNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a*b);
}
LiteGraph.registerNodeType("math/mul", MulNode);

function DivNode() {
	this.addInput('a', 'number');
	this.addInput('b', 'number');
	this.addOutput('result', 'number');
}
DivNode.title = 'a / b';
DivNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a/b);
}
LiteGraph.registerNodeType("math/div", DivNode);

function AngleNode() {
	this.addInput('theta', 'number');
	this.addOutput('normalized', 'number');
}

AngleNode.title = 'normalizeAngle'
AngleNode.prototype.onExecute = function() {
	var theta = this.getInputData(0);
	this.setOutputData(0, 255 * theta / (2*Math.PI));
}

LiteGraph.registerNodeType('polar/normalizeAngle', AngleNode);

function ToUint8() {
	this.addInput('x', 'number');
	this.addOutput('result', 'number');
}

ToUint8.title = 'toUint8';

ToUint8.prototype.onExecute = function() {
	this.setOutputData(0, this.getInputData(0) & 0xff);
}

LiteGraph.registerNodeType('math/toUint8', ToUint8);
