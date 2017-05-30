function LogNode() {
	this.addInput('val');
}

LogNode.prototype.onExecute = function() {
	console.log(this.getInputData(0));
}

LogNode.title = 'log'

LiteGraph.registerNodeType("lowlevel/debug/log", LogNode);

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
	this.addInput('a', Units.Numeric);
	this.addInput('b', Units.Numeric);
	this.addOutput('a + b');
}

AddNode.title = 'a + b';
AddNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, Units.Operations.add(a,b));
}
LiteGraph.registerNodeType("math/add", AddNode);

function SubNode() {
	this.addInput('a', Units.Numeric);
	this.addInput('b', Units.Numeric);
	this.addOutput('a - b');
}

SubNode.title = 'a - b';
SubNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, Units.Operations.sub(a,b));
}
LiteGraph.registerNodeType("math/sub", SubNode);

function MulNode() {
	this.addInput('a', Units.Numeric);
	this.addInput('b', Units.Numeric);
	this.addOutput('a * b');
}

MulNode.title = 'a * b';
MulNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, Units.Operations.mul(a,b));
}
LiteGraph.registerNodeType("math/mul", MulNode);

function AbsNode() {
	this.addInput('a', Units.Numeric);
	this.addOutput('|a|');
}

AbsNode.title = '|a|';
AbsNode.prototype.onExecute = function() {
	this.setOutputData(0, Math.abs(this.getInputData(0)));
}

LiteGraph.registerNodeType("math/abs", AbsNode);


function DivNode() {
	this.addInput('a', Units.Numeric);
	this.addInput('b', Units.Numeric);
	this.addOutput('a / b');
}
DivNode.title = 'a / b';
DivNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, Units.Operations.div(a,b));
}
LiteGraph.registerNodeType("math/div", DivNode);

function ModNode() {
	this.addInput('a', Units.Numeric);
	this.addInput('b', Units.Numeric);
	this.addOutput('a % b');
}
ModNode.title = 'a % b';
ModNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, Units.Operations.mod(a,b));
}
LiteGraph.registerNodeType("math/mod", ModNode);
