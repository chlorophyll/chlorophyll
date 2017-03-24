function qadd8Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
qadd8Node.title = "qadd8";
qadd8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_uint8_t(inputj)
    FastLED.qadd8(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/qadd8", qadd8Node);
function qadd7Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
qadd7Node.title = "qadd7";
qadd7Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_int8_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_int8_t(inputj)
    FastLED.qadd7(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/qadd7", qadd7Node);
function qsub8Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
qsub8Node.title = "qsub8";
qsub8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_uint8_t(inputj)
    FastLED.qsub8(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/qsub8", qsub8Node);
function qmul8Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
qmul8Node.title = "qmul8";
qmul8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_uint8_t(inputj)
    FastLED.qmul8(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/qmul8", qmul8Node);
function avg8Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
avg8Node.title = "avg8";
avg8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_uint8_t(inputj)
    FastLED.avg8(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/avg8", avg8Node);
function avg7Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
avg7Node.title = "avg7";
avg7Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_int8_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_int8_t(inputj)
    FastLED.avg7(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/avg7", avg7Node);
function avg15Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
avg15Node.title = "avg15";
avg15Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_int16_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_int16_t(inputj)
    FastLED.avg15(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/avg15", avg15Node);
function avg16Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("j");
    this.addOutput("result");
}
avg16Node.title = "avg16";
avg16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint16_t(inputi)
    var inputj = this.getInputData(2);
    inputj = TypeUtil.convert_to_uint16_t(inputj)
    FastLED.avg16(inputobj, inputi, inputj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/avg16", avg16Node);
function abs8Node() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
abs8Node.title = "abs8";
abs8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint8_t(inputx)
    FastLED.abs8(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/abs8", abs8Node);
function sqrt16Node() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
sqrt16Node.title = "sqrt16";
sqrt16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint16_t(inputx)
    FastLED.sqrt16(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/sqrt16", sqrt16Node);
function sin16Node() {
    this.addInput("obj");
    this.addInput("theta");
    this.addOutput("result");
}
sin16Node.title = "sin16";
sin16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputtheta = this.getInputData(1);
    inputtheta = TypeUtil.convert_to_uint16_t(inputtheta)
    FastLED.sin16(inputobj, inputtheta);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/sin16", sin16Node);
function cos16Node() {
    this.addInput("obj");
    this.addInput("theta");
    this.addOutput("result");
}
cos16Node.title = "cos16";
cos16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputtheta = this.getInputData(1);
    inputtheta = TypeUtil.convert_to_uint16_t(inputtheta)
    FastLED.cos16(inputobj, inputtheta);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/cos16", cos16Node);
function sin8Node() {
    this.addInput("obj");
    this.addInput("theta");
    this.addOutput("result");
}
sin8Node.title = "sin8";
sin8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputtheta = this.getInputData(1);
    inputtheta = TypeUtil.convert_to_uint8_t(inputtheta)
    FastLED.sin8(inputobj, inputtheta);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/sin8", sin8Node);
function cos8Node() {
    this.addInput("obj");
    this.addInput("theta");
    this.addOutput("result");
}
cos8Node.title = "cos8";
cos8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputtheta = this.getInputData(1);
    inputtheta = TypeUtil.convert_to_uint8_t(inputtheta)
    FastLED.cos8(inputobj, inputtheta);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/cos8", cos8Node);
function scale8Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("scale");
    this.addOutput("result");
}
scale8Node.title = "scale8";
scale8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    var inputscale = this.getInputData(2);
    inputscale = TypeUtil.convert_to_uint8_t(inputscale)
    FastLED.scale8(inputobj, inputi, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/scale8", scale8Node);
function scale8_videoNode() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("scale");
    this.addOutput("result");
}
scale8_videoNode.title = "scale8_video";
scale8_videoNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    var inputscale = this.getInputData(2);
    inputscale = TypeUtil.convert_to_uint8_t(inputscale)
    FastLED.scale8_video(inputobj, inputi, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/scale8_video", scale8_videoNode);
function scale16by8Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("scale");
    this.addOutput("result");
}
scale16by8Node.title = "scale16by8";
scale16by8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint16_t(inputi)
    var inputscale = this.getInputData(2);
    inputscale = TypeUtil.convert_to_uint8_t(inputscale)
    FastLED.scale16by8(inputobj, inputi, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/scale16by8", scale16by8Node);
function scale16Node() {
    this.addInput("obj");
    this.addInput("i");
    this.addInput("scale");
    this.addOutput("result");
}
scale16Node.title = "scale16";
scale16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint16_t(inputi)
    var inputscale = this.getInputData(2);
    inputscale = TypeUtil.convert_to_uint16_t(inputscale)
    FastLED.scale16(inputobj, inputi, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/scale16", scale16Node);
function dim8_rawNode() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
dim8_rawNode.title = "dim8_raw";
dim8_rawNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint8_t(inputx)
    FastLED.dim8_raw(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/dim8_raw", dim8_rawNode);
function dim8_videoNode() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
dim8_videoNode.title = "dim8_video";
dim8_videoNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint8_t(inputx)
    FastLED.dim8_video(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/dim8_video", dim8_videoNode);
function dim8_linNode() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
dim8_linNode.title = "dim8_lin";
dim8_linNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint8_t(inputx)
    FastLED.dim8_lin(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/dim8_lin", dim8_linNode);
function brighten8_rawNode() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
brighten8_rawNode.title = "brighten8_raw";
brighten8_rawNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint8_t(inputx)
    FastLED.brighten8_raw(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/brighten8_raw", brighten8_rawNode);
function brighten8_videoNode() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
brighten8_videoNode.title = "brighten8_video";
brighten8_videoNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint8_t(inputx)
    FastLED.brighten8_video(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/brighten8_video", brighten8_videoNode);
function brighten8_linNode() {
    this.addInput("obj");
    this.addInput("x");
    this.addOutput("result");
}
brighten8_linNode.title = "brighten8_lin";
brighten8_linNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputx = this.getInputData(1);
    inputx = TypeUtil.convert_to_uint8_t(inputx)
    FastLED.brighten8_lin(inputobj, inputx);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/brighten8_lin", brighten8_linNode);
function lerp8by8Node() {
    this.addInput("obj");
    this.addInput("a");
    this.addInput("b");
    this.addInput("frac");
    this.addOutput("result");
}
lerp8by8Node.title = "lerp8by8";
lerp8by8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputa = this.getInputData(1);
    inputa = TypeUtil.convert_to_uint8_t(inputa)
    var inputb = this.getInputData(2);
    inputb = TypeUtil.convert_to_uint8_t(inputb)
    var inputfrac = this.getInputData(3);
    inputfrac = TypeUtil.convert_to_uint8_t(inputfrac)
    FastLED.lerp8by8(inputobj, inputa, inputb, inputfrac);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/lerp8by8", lerp8by8Node);
function lerp16by16Node() {
    this.addInput("obj");
    this.addInput("a");
    this.addInput("b");
    this.addInput("frac");
    this.addOutput("result");
}
lerp16by16Node.title = "lerp16by16";
lerp16by16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputa = this.getInputData(1);
    inputa = TypeUtil.convert_to_uint16_t(inputa)
    var inputb = this.getInputData(2);
    inputb = TypeUtil.convert_to_uint16_t(inputb)
    var inputfrac = this.getInputData(3);
    inputfrac = TypeUtil.convert_to_uint16_t(inputfrac)
    FastLED.lerp16by16(inputobj, inputa, inputb, inputfrac);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/lerp16by16", lerp16by16Node);
function lerp16by8Node() {
    this.addInput("obj");
    this.addInput("a");
    this.addInput("b");
    this.addInput("frac");
    this.addOutput("result");
}
lerp16by8Node.title = "lerp16by8";
lerp16by8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputa = this.getInputData(1);
    inputa = TypeUtil.convert_to_uint16_t(inputa)
    var inputb = this.getInputData(2);
    inputb = TypeUtil.convert_to_uint16_t(inputb)
    var inputfrac = this.getInputData(3);
    inputfrac = TypeUtil.convert_to_uint8_t(inputfrac)
    FastLED.lerp16by8(inputobj, inputa, inputb, inputfrac);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/lerp16by8", lerp16by8Node);
function lerp15by8Node() {
    this.addInput("obj");
    this.addInput("a");
    this.addInput("b");
    this.addInput("frac");
    this.addOutput("result");
}
lerp15by8Node.title = "lerp15by8";
lerp15by8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputa = this.getInputData(1);
    inputa = TypeUtil.convert_to_int16_t(inputa)
    var inputb = this.getInputData(2);
    inputb = TypeUtil.convert_to_int16_t(inputb)
    var inputfrac = this.getInputData(3);
    inputfrac = TypeUtil.convert_to_uint8_t(inputfrac)
    FastLED.lerp15by8(inputobj, inputa, inputb, inputfrac);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/lerp15by8", lerp15by8Node);
function lerp15by16Node() {
    this.addInput("obj");
    this.addInput("a");
    this.addInput("b");
    this.addInput("frac");
    this.addOutput("result");
}
lerp15by16Node.title = "lerp15by16";
lerp15by16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputa = this.getInputData(1);
    inputa = TypeUtil.convert_to_int16_t(inputa)
    var inputb = this.getInputData(2);
    inputb = TypeUtil.convert_to_int16_t(inputb)
    var inputfrac = this.getInputData(3);
    inputfrac = TypeUtil.convert_to_uint16_t(inputfrac)
    FastLED.lerp15by16(inputobj, inputa, inputb, inputfrac);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/lerp15by16", lerp15by16Node);
function map8Node() {
    this.addInput("obj");
    this.addInput("in");
    this.addInput("rangeStart");
    this.addInput("rangeEnd");
    this.addOutput("result");
}
map8Node.title = "map8";
map8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputin = this.getInputData(1);
    inputin = TypeUtil.convert_to_uint8_t(inputin)
    var inputrangeStart = this.getInputData(2);
    inputrangeStart = TypeUtil.convert_to_uint8_t(inputrangeStart)
    var inputrangeEnd = this.getInputData(3);
    inputrangeEnd = TypeUtil.convert_to_uint8_t(inputrangeEnd)
    FastLED.map8(inputobj, inputin, inputrangeStart, inputrangeEnd);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/map8", map8Node);
function ease8InOutQuadNode() {
    this.addInput("obj");
    this.addInput("i");
    this.addOutput("result");
}
ease8InOutQuadNode.title = "ease8InOutQuad";
ease8InOutQuadNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    FastLED.ease8InOutQuad(inputobj, inputi);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/ease8InOutQuad", ease8InOutQuadNode);
function ease8InOutCubicNode() {
    this.addInput("obj");
    this.addInput("i");
    this.addOutput("result");
}
ease8InOutCubicNode.title = "ease8InOutCubic";
ease8InOutCubicNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    FastLED.ease8InOutCubic(inputobj, inputi);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/ease8InOutCubic", ease8InOutCubicNode);
function ease8InOutApproxNode() {
    this.addInput("obj");
    this.addInput("i");
    this.addOutput("result");
}
ease8InOutApproxNode.title = "ease8InOutApprox";
ease8InOutApproxNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputi = this.getInputData(1);
    inputi = TypeUtil.convert_to_uint8_t(inputi)
    FastLED.ease8InOutApprox(inputobj, inputi);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/ease8InOutApprox", ease8InOutApproxNode);
function triwave8Node() {
    this.addInput("obj");
    this.addInput("in");
    this.addOutput("result");
}
triwave8Node.title = "triwave8";
triwave8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputin = this.getInputData(1);
    inputin = TypeUtil.convert_to_uint8_t(inputin)
    FastLED.triwave8(inputobj, inputin);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/triwave8", triwave8Node);
function quadwave8Node() {
    this.addInput("obj");
    this.addInput("in");
    this.addOutput("result");
}
quadwave8Node.title = "quadwave8";
quadwave8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputin = this.getInputData(1);
    inputin = TypeUtil.convert_to_uint8_t(inputin)
    FastLED.quadwave8(inputobj, inputin);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/quadwave8", quadwave8Node);
function cubicwave8Node() {
    this.addInput("obj");
    this.addInput("in");
    this.addOutput("result");
}
cubicwave8Node.title = "cubicwave8";
cubicwave8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputin = this.getInputData(1);
    inputin = TypeUtil.convert_to_uint8_t(inputin)
    FastLED.cubicwave8(inputobj, inputin);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/cubicwave8", cubicwave8Node);
function squarewave8Node() {
    this.addInput("obj");
    this.addInput("in");
    this.addInput("pulsewidth");
    this.addOutput("result");
}
squarewave8Node.title = "squarewave8";
squarewave8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputin = this.getInputData(1);
    inputin = TypeUtil.convert_to_uint8_t(inputin)
    var inputpulsewidth = this.getInputData(2);
    inputpulsewidth = TypeUtil.convert_to_uint8_t(inputpulsewidth)
    FastLED.squarewave8(inputobj, inputin, inputpulsewidth);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/squarewave8", squarewave8Node);
function wheel8Node() {
    this.addInput("obj");
    this.addInput("in");
    this.addOutput("result");
}
wheel8Node.title = "wheel8";
wheel8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputin = this.getInputData(1);
    inputin = TypeUtil.convert_to_uint8_t(inputin)
    FastLED.wheel8(inputobj, inputin);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("math8/wheel8", wheel8Node);
function CHSVNode() {
    this.addInput("hue");
    this.addInput("sat");
    this.addInput("val");
    this.addOutput("object");
}
CHSVNode.title = "CHSV.construct";
CHSVNode.prototype.onExecute = function() {
    var inputhue = this.getInputData(0);
    inputhue = TypeUtil.convert_to_uint8_t(inputhue)
    var inputsat = this.getInputData(1);
    inputsat = TypeUtil.convert_to_uint8_t(inputsat)
    var inputval = this.getInputData(2);
    inputval = TypeUtil.convert_to_uint8_t(inputval)
    var output = FastLED.CHSVcreate(inputhue, inputsat, inputval);
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CHSV/construct", CHSVNode);

function CHSVgetHueNode() {
    this.addInput("obj");
    this.addOutput("hue");
}
CHSVgetHueNode.title = "CHSV.getHue";
CHSVgetHueNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var output = obj.hue;
    output = TypeUtil.convert_to_uint8_t(output)
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CHSV/gethue", CHSVgetHueNode);

function CHSVsetHueNode() {
    this.addInput("obj");
    this.addInput("hue");
    this.addOutput("result");
}
CHSVsetHueNode.title = "CHSV.setHue";
CHSVsetHueNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var val = this.getInputData(1);
    val = TypeUtil.convert_to_uint8_t(val)
    obj.hue = val;
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CHSV/sethue", CHSVsetHueNode);

function CHSVgetSatNode() {
    this.addInput("obj");
    this.addOutput("sat");
}
CHSVgetSatNode.title = "CHSV.getSat";
CHSVgetSatNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var output = obj.sat;
    output = TypeUtil.convert_to_uint8_t(output)
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CHSV/getsat", CHSVgetSatNode);

function CHSVsetSatNode() {
    this.addInput("obj");
    this.addInput("sat");
    this.addOutput("result");
}
CHSVsetSatNode.title = "CHSV.setSat";
CHSVsetSatNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var val = this.getInputData(1);
    val = TypeUtil.convert_to_uint8_t(val)
    obj.sat = val;
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CHSV/setsat", CHSVsetSatNode);

function CHSVgetValNode() {
    this.addInput("obj");
    this.addOutput("val");
}
CHSVgetValNode.title = "CHSV.getVal";
CHSVgetValNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var output = obj.val;
    output = TypeUtil.convert_to_uint8_t(output)
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CHSV/getval", CHSVgetValNode);

function CHSVsetValNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CHSVsetValNode.title = "CHSV.setVal";
CHSVsetValNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var val = this.getInputData(1);
    val = TypeUtil.convert_to_uint8_t(val)
    obj.val = val;
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CHSV/setval", CHSVsetValNode);

function CRGBNode() {
    this.addInput("r");
    this.addInput("g");
    this.addInput("b");
    this.addOutput("object");
}
CRGBNode.title = "CRGB.construct";
CRGBNode.prototype.onExecute = function() {
    var inputr = this.getInputData(0);
    inputr = TypeUtil.convert_to_uint8_t(inputr)
    var inputg = this.getInputData(1);
    inputg = TypeUtil.convert_to_uint8_t(inputg)
    var inputb = this.getInputData(2);
    inputb = TypeUtil.convert_to_uint8_t(inputb)
    var output = FastLED.CRGBcreate(inputr, inputg, inputb);
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CRGB/construct", CRGBNode);

function CRGBfromColorCodeNode() {
    this.addInput("colorCode");
    this.addOutput("object");
}
CRGBfromColorCodeNode.title = "CRGB.fromColorCode";
CRGBfromColorCodeNode.prototype.onExecute = function() {
    var inputcolorCode = this.getInputData(0);
    inputcolorCode = TypeUtil.convert_to_uint32_t(inputcolorCode)
    var object = FastLED.CRGBfromColorCode(inputcolorCode);
    this.setOutputData(0, object);
}
LiteGraph.registerNodeType("CRGB/fromColorCode", CRGBfromColorCodeNode);

function CRGBcloneNode() {
    this.addOutput("object");
}
CRGBcloneNode.title = "CRGB.clone";
CRGBcloneNode.prototype.onExecute = function() {
    var object = FastLED.CRGBclone();
    this.setOutputData(0, object);
}
LiteGraph.registerNodeType("CRGB/clone", CRGBcloneNode);

function CRGBfromHSVNode() {
    this.addInput("CHSV");
    this.addOutput("object");
}
CRGBfromHSVNode.title = "CRGB.fromHSV";
CRGBfromHSVNode.prototype.onExecute = function() {
    var inputCHSV = this.getInputData(0);
    var object = FastLED.CRGBfromHSV(inputCHSV);
    this.setOutputData(0, object);
}
LiteGraph.registerNodeType("CRGB/fromHSV", CRGBfromHSVNode);

function CRGBgetRNode() {
    this.addInput("obj");
    this.addOutput("r");
}
CRGBgetRNode.title = "CRGB.getR";
CRGBgetRNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var output = obj.r;
    output = TypeUtil.convert_to_uint8_t(output)
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CRGB/getr", CRGBgetRNode);

function CRGBsetRNode() {
    this.addInput("obj");
    this.addInput("r");
    this.addOutput("result");
}
CRGBsetRNode.title = "CRGB.setR";
CRGBsetRNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var val = this.getInputData(1);
    val = TypeUtil.convert_to_uint8_t(val)
    obj.r = val;
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/setr", CRGBsetRNode);

function CRGBgetGNode() {
    this.addInput("obj");
    this.addOutput("g");
}
CRGBgetGNode.title = "CRGB.getG";
CRGBgetGNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var output = obj.g;
    output = TypeUtil.convert_to_uint8_t(output)
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CRGB/getg", CRGBgetGNode);

function CRGBsetGNode() {
    this.addInput("obj");
    this.addInput("g");
    this.addOutput("result");
}
CRGBsetGNode.title = "CRGB.setG";
CRGBsetGNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var val = this.getInputData(1);
    val = TypeUtil.convert_to_uint8_t(val)
    obj.g = val;
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/setg", CRGBsetGNode);

function CRGBgetBNode() {
    this.addInput("obj");
    this.addOutput("b");
}
CRGBgetBNode.title = "CRGB.getB";
CRGBgetBNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var output = obj.b;
    output = TypeUtil.convert_to_uint8_t(output)
    this.setOutputData(0, output);
}
LiteGraph.registerNodeType("CRGB/getb", CRGBgetBNode);

function CRGBsetBNode() {
    this.addInput("obj");
    this.addInput("b");
    this.addOutput("result");
}
CRGBsetBNode.title = "CRGB.setB";
CRGBsetBNode.prototype.onExecute = function() {
    var obj = this.getInputData(0);
    var val = this.getInputData(1);
    val = TypeUtil.convert_to_uint8_t(val)
    obj.b = val;
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/setb", CRGBsetBNode);

function CRGBsetHSVNode() {
    this.addInput("obj");
    this.addInput("hue");
    this.addInput("sat");
    this.addInput("val");
    this.addOutput("result");
}
CRGBsetHSVNode.title = "CRGB.setHSV";
CRGBsetHSVNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputhue = this.getInputData(1);
    inputhue = TypeUtil.convert_to_uint8_t(inputhue)
    var inputsat = this.getInputData(2);
    inputsat = TypeUtil.convert_to_uint8_t(inputsat)
    var inputval = this.getInputData(3);
    inputval = TypeUtil.convert_to_uint8_t(inputval)
    FastLED.CRGBsetHSV(inputobj, inputhue, inputsat, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/setHSV", CRGBsetHSVNode);

function CRGBsetHueNode() {
    this.addInput("obj");
    this.addInput("hue");
    this.addOutput("result");
}
CRGBsetHueNode.title = "CRGB.setHue";
CRGBsetHueNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputhue = this.getInputData(1);
    inputhue = TypeUtil.convert_to_uint8_t(inputhue)
    FastLED.CRGBsetHue(inputobj, inputhue);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/setHue", CRGBsetHueNode);

function CRGBsetColorCodeNode() {
    this.addInput("obj");
    this.addInput("colorCode");
    this.addOutput("result");
}
CRGBsetColorCodeNode.title = "CRGB.setColorCode";
CRGBsetColorCodeNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputcolorCode = this.getInputData(1);
    inputcolorCode = TypeUtil.convert_to_uint32_t(inputcolorCode)
    FastLED.CRGBsetColorCode(inputobj, inputcolorCode);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/setColorCode", CRGBsetColorCodeNode);

function CRGBaddNode() {
    this.addInput("obj");
    this.addInput("rhs");
    this.addOutput("result");
}
CRGBaddNode.title = "CRGB.add";
CRGBaddNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputrhs = this.getInputData(1);
    inputrhs = TypeUtil.convert_to_uint8_t(inputrhs)
    FastLED.CRGBadd(inputobj, inputrhs);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/add", CRGBaddNode);

function CRGBaddToRGBNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CRGBaddToRGBNode.title = "CRGB.addToRGB";
CRGBaddToRGBNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputval = this.getInputData(1);
    FastLED.CRGBaddToRGB(inputobj, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/addToRGB", CRGBaddToRGBNode);

function CRGBincNode() {
    this.addInput("obj");
    this.addOutput("result");
}
CRGBincNode.title = "CRGB.inc";
CRGBincNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    FastLED.CRGBinc(inputobj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/inc", CRGBincNode);

function CRGBsubtractNode() {
    this.addInput("obj");
    this.addInput("rhs");
    this.addOutput("result");
}
CRGBsubtractNode.title = "CRGB.subtract";
CRGBsubtractNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputrhs = this.getInputData(1);
    inputrhs = TypeUtil.convert_to_uint8_t(inputrhs)
    FastLED.CRGBsubtract(inputobj, inputrhs);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/subtract", CRGBsubtractNode);

function CRGBsubtractFromRGBNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CRGBsubtractFromRGBNode.title = "CRGB.subtractFromRGB";
CRGBsubtractFromRGBNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputval = this.getInputData(1);
    FastLED.CRGBsubtractFromRGB(inputobj, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/subtractFromRGB", CRGBsubtractFromRGBNode);

function CRGBdecNode() {
    this.addInput("obj");
    this.addOutput("result");
}
CRGBdecNode.title = "CRGB.dec";
CRGBdecNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    FastLED.CRGBdec(inputobj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/dec", CRGBdecNode);

function CRGBmulNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CRGBmulNode.title = "CRGB.mul";
CRGBmulNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputval = this.getInputData(1);
    inputval = TypeUtil.convert_to_uint8_t(inputval)
    FastLED.CRGBmul(inputobj, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/mul", CRGBmulNode);

function CRGBdivNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CRGBdivNode.title = "CRGB.div";
CRGBdivNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputval = this.getInputData(1);
    inputval = TypeUtil.convert_to_uint8_t(inputval)
    FastLED.CRGBdiv(inputobj, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/div", CRGBdivNode);

function CRGBrshNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CRGBrshNode.title = "CRGB.rsh";
CRGBrshNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputval = this.getInputData(1);
    inputval = TypeUtil.convert_to_uint8_t(inputval)
    FastLED.CRGBrsh(inputobj, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/rsh", CRGBrshNode);

function CRGBnscale8_videoNode() {
    this.addInput("obj");
    this.addInput("scale");
    this.addOutput("result");
}
CRGBnscale8_videoNode.title = "CRGB.nscale8_video";
CRGBnscale8_videoNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputscale = this.getInputData(1);
    inputscale = TypeUtil.convert_to_uint8_t(inputscale)
    FastLED.CRGBnscale8_video(inputobj, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/nscale8_video", CRGBnscale8_videoNode);

function CRGBfadeLightByNode() {
    this.addInput("obj");
    this.addInput("scale");
    this.addOutput("result");
}
CRGBfadeLightByNode.title = "CRGB.fadeLightBy";
CRGBfadeLightByNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputscale = this.getInputData(1);
    inputscale = TypeUtil.convert_to_uint8_t(inputscale)
    FastLED.CRGBfadeLightBy(inputobj, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/fadeLightBy", CRGBfadeLightByNode);

function CRGBnscale8Node() {
    this.addInput("obj");
    this.addInput("scale");
    this.addOutput("result");
}
CRGBnscale8Node.title = "CRGB.nscale8";
CRGBnscale8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputscale = this.getInputData(1);
    inputscale = TypeUtil.convert_to_uint8_t(inputscale)
    FastLED.CRGBnscale8(inputobj, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/nscale8", CRGBnscale8Node);

function CRGBnscale8_channelsNode() {
    this.addInput("obj");
    this.addInput("scaleRGB");
    this.addOutput("result");
}
CRGBnscale8_channelsNode.title = "CRGB.nscale8_channels";
CRGBnscale8_channelsNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputscaleRGB = this.getInputData(1);
    FastLED.CRGBnscale8_channels(inputobj, inputscaleRGB);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/nscale8_channels", CRGBnscale8_channelsNode);

function CRGBfadeToBlackByNode() {
    this.addInput("obj");
    this.addInput("scale");
    this.addOutput("result");
}
CRGBfadeToBlackByNode.title = "CRGB.fadeToBlackBy";
CRGBfadeToBlackByNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputscale = this.getInputData(1);
    inputscale = TypeUtil.convert_to_uint8_t(inputscale)
    FastLED.CRGBfadeToBlackBy(inputobj, inputscale);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/fadeToBlackBy", CRGBfadeToBlackByNode);

function CRGBorNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CRGBorNode.title = "CRGB.or";
CRGBorNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputval = this.getInputData(1);
    inputval = TypeUtil.convert_to_uint8_t(inputval)
    FastLED.CRGBor(inputobj, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/or", CRGBorNode);

function CRGBor_channelsNode() {
    this.addInput("obj");
    this.addInput("rhs");
    this.addOutput("result");
}
CRGBor_channelsNode.title = "CRGB.or_channels";
CRGBor_channelsNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputrhs = this.getInputData(1);
    FastLED.CRGBor_channels(inputobj, inputrhs);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/or_channels", CRGBor_channelsNode);

function CRGBandNode() {
    this.addInput("obj");
    this.addInput("val");
    this.addOutput("result");
}
CRGBandNode.title = "CRGB.and";
CRGBandNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputval = this.getInputData(1);
    inputval = TypeUtil.convert_to_uint8_t(inputval)
    FastLED.CRGBand(inputobj, inputval);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/and", CRGBandNode);

function CRGBand_channelsNode() {
    this.addInput("obj");
    this.addInput("rhs");
    this.addOutput("result");
}
CRGBand_channelsNode.title = "CRGB.and_channels";
CRGBand_channelsNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputrhs = this.getInputData(1);
    FastLED.CRGBand_channels(inputobj, inputrhs);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/and_channels", CRGBand_channelsNode);

function CRGBinvertedNode() {
    this.addInput("obj");
    this.addOutput("result");
}
CRGBinvertedNode.title = "CRGB.inverted";
CRGBinvertedNode.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    FastLED.CRGBinverted(inputobj);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/inverted", CRGBinvertedNode);

function CRGBlerp8Node() {
    this.addInput("obj");
    this.addInput("target");
    this.addInput("frac");
    this.addOutput("result");
}
CRGBlerp8Node.title = "CRGB.lerp8";
CRGBlerp8Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputtarget = this.getInputData(1);
    var inputfrac = this.getInputData(2);
    inputfrac = TypeUtil.convert_to_uint8_t(inputfrac)
    FastLED.CRGBlerp8(inputobj, inputtarget, inputfrac);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/lerp8", CRGBlerp8Node);

function CRGBlerp16Node() {
    this.addInput("obj");
    this.addInput("target");
    this.addInput("frac");
    this.addOutput("result");
}
CRGBlerp16Node.title = "CRGB.lerp16";
CRGBlerp16Node.prototype.onExecute = function() {
    var inputobj = this.getInputData(0);
    var inputtarget = this.getInputData(1);
    var inputfrac = this.getInputData(2);
    inputfrac = TypeUtil.convert_to_uint8_t(inputfrac)
    FastLED.CRGBlerp16(inputobj, inputtarget, inputfrac);
    this.setOutputData(0, obj);
}
LiteGraph.registerNodeType("CRGB/lerp16", CRGBlerp16Node);

