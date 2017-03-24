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
	this.addInput('clause');
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
	this.addOutput('result');
}

EqualsNode.title = 'equals'

EqualsNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a == b);
}
LiteGraph.registerNodeType("logic/equals", EqualsNode);



function AddNode() {
	this.addInput('a');
	this.addInput('b');
	this.addOutput('result');
}
AddNode.title = 'add';
AddNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a+b);
}
LiteGraph.registerNodeType("math/add", AddNode);

function DivNode() {
	this.addInput('a');
	this.addInput('b');
	this.addOutput('result');
}
DivNode.title = 'div';
DivNode.prototype.onExecute = function() {
	var a = this.getInputData(0);
	var b = this.getInputData(1);
	this.setOutputData(0, a/b);
}
LiteGraph.registerNodeType("math/div", DivNode);

