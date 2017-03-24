//not tested nor finished

(function( global )
{

var LGAudio = {};
global.LGAudio = LGAudio;

LGAudio.getAudioContext = function()
{
	if(!this._audio_context)
	{
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		if(!window.AudioContext)
		{
			console.error("AudioContext not supported by browser");
			return null;
		}
		this._audio_context = new AudioContext();	
		this._audio_context.onmessage = function(msg) { console.log("msg",msg);};
		this._audio_context.onended = function(msg) { console.log("ended",msg);};
		this._audio_context.oncomplete = function(msg) { console.log("complete",msg);};
	}

	//in case it crashes
	if(this._audio_context.state == "suspended")
		this._audio_context.resume();
	return this._audio_context;
}

LGAudio.connect = function( audionodeA, audionodeB )
{
	try
	{
		audionodeA.connect( audionodeB );
	}
	catch (err)
	{
		console.warn("LGraphAudio:",err);
	}
}

LGAudio.disconnect = function( audionodeA, audionodeB )
{
	try
	{
		audionodeA.disconnect( audionodeB );
	}
	catch (err)
	{
		console.warn("LGraphAudio:",err);
	}
}

LGAudio.changeAllAudiosConnections = function( node, connect )
{
	if(node.inputs)
	{
		for(var i = 0; i < node.inputs.length; ++i)
		{
			var input = node.inputs[i];
			var link_info = node.graph.links[ input.link ];
			if(!link_info)
				continue;

			var origin_node = node.graph.getNodeById( link_info.origin_id );
			var origin_audionode = null;
			if( origin_node.getAudioNodeInOutputSlot )
				origin_audionode = origin_node.getAudioNodeInOutputSlot( link_info.origin_slot );
			else
				origin_audionode = origin_node.audionode;

			var target_audionode = null;
			if( node.getAudioNodeInInputSlot )
				target_audionode = node.getAudioNodeInInputSlot( i );
			else
				target_audionode = node.audionode;

			if(connect)
				LGAudio.connect( origin_audionode, target_audionode );
			else
				LGAudio.disconnect( origin_audionode, target_audionode );
		}
	}

	if(node.outputs)
	{
		for(var i = 0; i < node.outputs.length; ++i)
		{
			var output = node.outputs[i];
			for(var j = 0; j < output.links.length; ++j)
			{
				var link_info = node.graph.links[ output.links[j] ];
				if(!link_info)
					continue;

				var origin_audionode = null;
				if( node.getAudioNodeInOutputSlot )
					origin_audionode = node.getAudioNodeInOutputSlot( i );
				else
					origin_audionode = node.audionode;

				var target_node = node.graph.getNodeById( link_info.target_id );
				var target_audionode = null;
				if( target_node.getAudioNodeInInputSlot )
					target_audionode = target_node.getAudioNodeInInputSlot( link_info.target_slot );
				else
					target_audionode = target_node.audionode;

				if(connect)
					LGAudio.connect( origin_audionode, target_audionode );
				else
					LGAudio.disconnect( origin_audionode, target_audionode );
			}
		}
	}
}

//used by many nodes
LGAudio.onConnectionsChange = function( connection, slot, connected, link_info )
{
	//only process the outputs events
	if(connection != LiteGraph.OUTPUT)
		return;

	var target_node = null;
	if( link_info )
		target_node = this.graph.getNodeById( link_info.target_id );

	if( !target_node )
		return;

	//get origin audionode
	var local_audionode = null;
	if(this.getAudioNodeInOutputSlot)
		local_audionode = this.getAudioNodeInOutputSlot( slot );
	else
		local_audionode = this.audionode;

	//get target audionode
	var target_audionode = null;
	if(target_node.getAudioNodeInInputSlot)
		target_audionode = target_node.getAudioNodeInInputSlot( link_info.target_slot );
	else
		target_audionode = target_node.audionode;

	//do the connection/disconnection
	if( connected )	
		LGAudio.connect( local_audionode, target_audionode );
	else
		LGAudio.disconnect( local_audionode, target_audionode );
}

//this function helps creating wrappers to existing classes
LGAudio.createAudioNodeWrapper = function( class_object )
{
	class_object.prototype.onPropertyChanged = function(name, value)
	{
		if(!this.audionode)
			return;

		if( this.audionode[ name ] === undefined )
			return;

		if( this.audionode[ name ].value !== undefined )
			this.audionode[ name ].value = value;
		else
			this.audionode[ name ] = value;
	}

	class_object.prototype.onConnectionsChange = LGAudio.onConnectionsChange;
}


LGAudio.cached_audios = {};

LGAudio.loadSound = function( url, on_complete, on_error )
{
	if( LGAudio.cached_audios[ url ] && url.indexOf("blob:") == -1 )
	{
		if(on_complete)
			on_complete( LGAudio.cached_audios[ url ] );
		return;
	}

	//load new sample
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	var context = LGAudio.getAudioContext();

	// Decode asynchronously
	request.onload = function() {
		console.log("AudioSource loaded");
		context.decodeAudioData( request.response, function( buffer ) {
			console.log("AudioSource decoded");
			LGAudio.cached_audios[ url ] = buffer;
			if(on_complete)
				on_complete( buffer );
		}, onError);
	}
	request.send();

	function onError(err)
	{
		console.log("Audio loading sample error:",err);
		if(on_error)
			on_error(err);
	}

	return request;
}


//****************************************************

function LGAudioSource()
{
	this.properties = {
		src: "",
		gain: 0.5,
		loop: true,
		autoplay: true,
		playbackRate: 1
	};

	this._loading_audio = false;
	this._audio_buffer = null;
	this._audionodes = [];

	this.addOutput( "out", "audio" );
	this.addInput( "gain", "number" );

	//init context
	var context = LGAudio.getAudioContext();

	//create gain node
	this.audionode = context.createGain();
	this.audionode.graphnode = this;
	this.audionode.gain.value = this.properties.gain;

	//debug
	if(this.properties.src)
		this.loadSound( this.properties.src );
}

LGAudioSource.supported_extensions = ["wav","ogg","mp3"];


LGAudioSource.prototype.onAdded = function(graph)
{
	if(graph.status === LGraph.STATUS_RUNNING)
		this.onStart();
}

LGAudioSource.prototype.onStart = function()
{
	if(!this._audio_buffer)
		return;

	if(this.properties.autoplay)
		this.playBuffer( this._audio_buffer );
}

LGAudioSource.prototype.onStop = function()
{
	this.stopAllSounds();
}

LGAudioSource.prototype.onRemoved = function()
{
	this.stopAllSounds();
	if(this._dropped_url)
		URL.revokeObjectURL( this._url );
}

LGAudioSource.prototype.stopAllSounds = function()
{
	//iterate and stop
	for(var i = 0; i < this._audionodes.length; ++i )
	{
		this._audionodes[i].stop();
		//this._audionodes[i].disconnect( this.audionode );
	}
	this._audionodes.length = 0;
}

LGAudioSource.prototype.onExecute = function()
{
	if(!this.inputs)
		return;

	for(var i = 0; i < this.inputs.length; ++i)
	{
		var input = this.inputs[i];
		if(!input.link)
			continue;
		var v = this.getInputData(i);
		if( v === undefined )
			continue;
		if( input.name == "gain" )
			this.audionode.gain.value = v;
		else if( input.name == "playbackRate" )
			this.properties.playbackRate = v;
	}
}

LGAudioSource.prototype.onAction = function(event)
{
	if(this._audio_buffer)
	{
		if(event == "Play")
			this.playBuffer(this._audio_buffer);
		else if(event == "Stop")
			this.stopAllSounds();
	}
}

LGAudioSource.prototype.onPropertyChanged = function( name, value )
{
	if( name == "src" ) 
		this.loadSound( value );
	else if(name == "gain")
		this.audionode.gain.value = value;
}

LGAudioSource.prototype.playBuffer = function( buffer )
{
	var that = this;
	var context = LGAudio.getAudioContext();

	//create a new audionode (this is mandatory, AudioAPI doesnt like to reuse old ones)
	var audionode = context.createBufferSource(); //create a AudioBufferSourceNode
	audionode.graphnode = this;
	audionode.buffer = buffer;
	audionode.loop = this.properties.loop;
	audionode.playbackRate.value = this.properties.playbackRate;
	this._audionodes.push( audionode );
	audionode.connect( this.audionode ); //connect to gain
	this._audionodes.push( audionode );

	audionode.onended = function()
	{
		//console.log("ended!");
		that.trigger("ended");
		//remove
		var index = that._audionodes.indexOf( audionode );
		if(index != -1)
			that._audionodes.splice(index,1);
	}

	audionode.start();
	return audionode;
}

LGAudioSource.prototype.loadSound = function( url )
{
	var that = this;

	//kill previous load
	if(this._request)
	{
		this._request.abort();
		this._request = null;
	}

	this._audio_buffer = null;
	this._loading_audio = false;

	if(!url)
		return;

	this._request = LGAudio.loadSound( url, inner );

	this._loading_audio = true;
	this.boxcolor = "#AA4";

	function inner( buffer )
	{
		this.boxcolor = LiteGraph.NODE_DEFAULT_BOXCOLOR;
		that._audio_buffer = buffer;
		that._loading_audio = false;
		//if is playing, then play it
		if(that.graph && that.graph.status === LGraph.STATUS_RUNNING)
			that.onStart(); //this controls the autoplay already
	}
}

//Helps connect/disconnect AudioNodes when new connections are made in the node
LGAudioSource.prototype.onConnectionsChange = LGAudio.onConnectionsChange;

LGAudioSource.prototype.onGetInputs = function()
{
	return [["playbackRate","number"],["Play",LiteGraph.ACTION],["Stop",LiteGraph.ACTION]];
}

LGAudioSource.prototype.onGetOutputs = function()
{
	return [["ended",LiteGraph.EVENT]];
}

LGAudioSource.prototype.onDropFile = function(file)
{
	if(this._dropped_url)
		URL.revokeObjectURL( this._dropped_url );
	var url = URL.createObjectURL( file );
	this.properties.src = url;
	this.loadSound( url );
	this._dropped_url = url;
}


LGAudioSource.title = "Source";
LGAudioSource.desc = "Plays audio";
LiteGraph.registerNodeType("audio/source", LGAudioSource);


//*****************************************************

function LGAudioAnalyser()
{
	this.properties = {
		fftSize: 2048,
		minDecibels: -100,
		maxDecibels: -10,
		smoothingTimeConstant: 0.5
	};

	var context = LGAudio.getAudioContext();

	this.audionode = context.createAnalyser();
	this.audionode.graphnode = this;
	this.audionode.fftSize = this.properties.fftSize;
	this.audionode.minDecibels = this.properties.minDecibels;
	this.audionode.maxDecibels = this.properties.maxDecibels;
	this.audionode.smoothingTimeConstant = this.properties.smoothingTimeConstant;

	this.addInput("in","audio");
	this.addOutput("freqs","array");
	//this.addOutput("time","freq");

	this._freq_bin = null;
	this._time_bin = null;
}

LGAudioAnalyser.prototype.onPropertyChanged = function(name, value)
{
	this.audionode[ name ] = value;
}

LGAudioAnalyser.prototype.onExecute = function()
{
	if(this.isOutputConnected(0))
	{
		//send FFT
		var bufferLength = this.audionode.frequencyBinCount;
		if( !this._freq_bin || this._freq_bin.length != bufferLength )
			this._freq_bin = new Uint8Array( bufferLength );
		this.audionode.getByteFrequencyData( this._freq_bin );
		this.setOutputData(0,this._freq_bin);
	}

	//send analyzer
	if(this.isOutputConnected(1))
		this.setOutputData(1,this.audionode);


	//properties
	for(var i = 1; i < this.inputs.length; ++i)
	{
		var input = this.inputs[i];
		if(!input.link)
			continue;
		var v = this.getInputData(i);
		if (v !== undefined)
			this.audionode[ input.name ].value = v;
	}



	//time domain
	//this.audionode.getFloatTimeDomainData( dataArray );
}

LGAudioAnalyser.prototype.onGetInputs = function()
{
	return [["minDecibels","number"],["maxDecibels","number"],["smoothingTimeConstant","number"]];
}

/*
LGAudioAnalyser.prototype.onGetOutputs = function()
{
	return [["Analyzer","analyzer"]];
}
*/

LGAudioAnalyser.title = "Analyser";
LGAudioAnalyser.desc = "Audio Analyser";
LiteGraph.registerNodeType( "audio/analyser", LGAudioAnalyser );

//*****************************************************

function LGAudioGain()
{
	//default 
	this.properties = {
		gain: 1
	};

	this.audionode = LGAudio.getAudioContext().createGain();
	this.addInput("in","audio");
	this.addInput("gain","number");
	this.addOutput("out","audio");
}

LGAudioGain.prototype.onExecute = function()
{
	if(!this.inputs || !this.inputs.length)
		return;

	for(var i = 1; i < this.inputs.length; ++i)
	{
		var input = this.inputs[i];
		var v = this.getInputData(i);
		if(v !== undefined)
			this.audionode[ input.name ].value = v;
	}
}

LGAudio.createAudioNodeWrapper( LGAudioGain );

LGAudioGain.title = "Gain";
LGAudioGain.desc = "Audio gain";
LiteGraph.registerNodeType("audio/gain", LGAudioGain);


function LGAudioConvolver()
{
	//default 
	this.properties = {
		impulse_src:"",
		normalize: true
	};

	this.audionode = LGAudio.getAudioContext().createConvolver();
	this.addInput("in","audio");
	this.addOutput("out","audio");
}

LGAudio.createAudioNodeWrapper( LGAudioConvolver );

LGAudioConvolver.prototype.onRemove = function()
{
	if(this._dropped_url)
		URL.revokeObjectURL( this._dropped_url );
}

LGAudioConvolver.prototype.onPropertyChanged = function( name, value )
{
	if( name == "impulse_src" ) 
		this.loadImpulse( value );
	else if( name == "normalize" ) 
		this.audionode.normalize = value;
}

LGAudioConvolver.prototype.onDropFile = function(file)
{
	if(this._dropped_url)
		URL.revokeObjectURL( this._dropped_url );
	this._dropped_url = URL.createObjectURL( file );
	this.properties.impulse_src = this._dropped_url;
	this.loadImpulse( this._dropped_url );
}

LGAudioConvolver.prototype.loadImpulse = function( url )
{
	var that = this;

	//kill previous load
	if(this._request)
	{
		this._request.abort();
		this._request = null;
	}

	this._impulse_buffer = null;
	this._loading_impulse = false;

	if(!url)
		return;

	//load new sample
	this._request = LGAudio.loadSound( url, inner );
	this._loading_impulse = true;

	// Decode asynchronously
	function inner( buffer ) {
			that._impulse_buffer = buffer;
			that.audionode.buffer = buffer;
			console.log("Impulse signal set");
			that._loading_impulse = false;
	}
}

LGAudioConvolver.title = "Convolver";
LGAudioConvolver.desc = "Convolves the signal (used for reverb)";
LiteGraph.registerNodeType("audio/convolver", LGAudioConvolver);


function LGAudioDynamicsCompressor()
{
	//default 
	this.properties = {
		threshold: -50,
		knee: 40,
		ratio: 12,
		reduction: -20,
		attack: 0,
		release: 0.25
	};

	this.audionode = LGAudio.getAudioContext().createDynamicsCompressor();
	this.addInput("in","audio");
	this.addOutput("out","audio");
}

LGAudio.createAudioNodeWrapper( LGAudioDynamicsCompressor );

LGAudioDynamicsCompressor.prototype.onExecute = function()
{
	if(!this.inputs || !this.inputs.length)
		return;
	for(var i = 1; i < this.inputs.length; ++i)
	{
		var input = this.inputs[i];
		if(!input.link)
			continue;
		var v = this.getInputData(i);
		if(v !== undefined)
			this.audionode[ input.name ].value = v;
	}
}

LGAudioDynamicsCompressor.prototype.onGetInputs = function()
{
	return [["threshold","number"],["knee","number"],["ratio","number"],["reduction","number"],["attack","number"],["release","number"]];
}

LGAudioDynamicsCompressor.title = "DynamicsCompressor";
LGAudioDynamicsCompressor.desc = "Dynamics Compressor";
LiteGraph.registerNodeType("audio/dynamicsCompressor", LGAudioDynamicsCompressor);


function LGAudioWaveShaper()
{
	//default 
	this.properties = {
	};

	this.audionode = LGAudio.getAudioContext().createWaveShaper();
	this.addInput("in","audio");
	this.addInput("shape","waveshape");
	this.addOutput("out","audio");
}

LGAudioWaveShaper.prototype.onExecute = function()
{
	if(!this.inputs || !this.inputs.length)
		return;
	var v = this.getInputData(1);
	if(v === undefined)
		return;
	this.audionode.curve = v;
}

LGAudioWaveShaper.prototype.setWaveShape = function(shape)
{
	this.audionode.curve = shape;
}

LGAudio.createAudioNodeWrapper( LGAudioWaveShaper );

/* disabled till I dont find a way to do a wave shape
LGAudioWaveShaper.title = "WaveShaper";
LGAudioWaveShaper.desc = "Distortion using wave shape";
LiteGraph.registerNodeType("audio/waveShaper", LGAudioWaveShaper);
*/

function LGAudioMixer()
{
	//default 
	this.properties = {
		gain1: 0.5,
		gain2: 0.5
	};

	this.audionode = LGAudio.getAudioContext().createGain();

	this.audionode1 = LGAudio.getAudioContext().createGain();
	this.audionode1.gain.value = this.properties.gain1;
	this.audionode2 = LGAudio.getAudioContext().createGain();
	this.audionode2.gain.value = this.properties.gain2;

	this.audionode1.connect( this.audionode );
	this.audionode2.connect( this.audionode );

	this.addInput("in1","audio");
	this.addInput("in1 gain","number");
	this.addInput("in2","audio");
	this.addInput("in2 gain","number");

	this.addOutput("out","audio");
}

LGAudioMixer.prototype.getAudioNodeInInputSlot = function( slot )
{
	if(slot == 0)
		return this.audionode1;
	else if(slot == 2)
		return this.audionode2;
}

LGAudioMixer.prototype.onExecute = function()
{
	if(!this.inputs || !this.inputs.length)
		return;

	for(var i = 1; i < this.inputs.length; ++i)
	{
		var input = this.inputs[i];

		if(!input.link || input.type == "audio")
			continue;

		var v = this.getInputData(i);
		if(v === undefined)
			continue;

		if(i == 1)
			this.audionode1.gain.value = v;
		else if(i == 3)
			this.audionode2.gain.value = v;
	}
}

LGAudio.createAudioNodeWrapper( LGAudioMixer );

LGAudioMixer.title = "Mixer";
LGAudioMixer.desc = "Audio mixer";
LiteGraph.registerNodeType("audio/mixer", LGAudioMixer);


function LGAudioDelay()
{
	//default 
	this.properties = {
		delayTime: 0.5
	};

	this.audionode = LGAudio.getAudioContext().createDelay( 10 );
	this.audionode.delayTime.value = this.properties.delayTime;
	this.addInput("in","audio");
	this.addInput("time","number");
	this.addOutput("out","audio");
}

LGAudio.createAudioNodeWrapper( LGAudioDelay );

LGAudioDelay.prototype.onExecute = function()
{
	var v = this.getInputData(1);
	if(v !== undefined )
		this.audionode.delayTime.value = v;
}

LGAudioDelay.title = "Delay";
LGAudioDelay.desc = "Audio delay";
LiteGraph.registerNodeType("audio/delay", LGAudioDelay);


function LGAudioBiquadFilter()
{
	//default 
	this.properties = {
		frequency: 350,
		detune: 0,
		Q: 1
	};
	this.addProperty("type","lowpass","enum",{values:["lowpass","highpass","bandpass","lowshelf","highshelf","peaking","notch","allpass"]});	

	//create node
	this.audionode = LGAudio.getAudioContext().createBiquadFilter();

	//slots
	this.addInput("in","audio");
	this.addOutput("out","audio");
}

LGAudioBiquadFilter.prototype.onExecute = function()
{
	if(!this.inputs || !this.inputs.length)
		return;

	for(var i = 1; i < this.inputs.length; ++i)
	{
		var input = this.inputs[i];
		if(!input.link)
			continue;
		var v = this.getInputData(i);
		if(v !== undefined)
			this.audionode[ input.name ].value = v;
	}
}

LGAudioBiquadFilter.prototype.onGetInputs = function()
{
	return [["frequency","number"],["detune","number"],["Q","number"]];
}

LGAudio.createAudioNodeWrapper( LGAudioBiquadFilter );

LGAudioBiquadFilter.title = "BiquadFilter";
LGAudioBiquadFilter.desc = "Audio filter";
LiteGraph.registerNodeType("audio/biquadfilter", LGAudioBiquadFilter);


//*****************************************************

//EXTRA 


function LGAudioVisualization()
{
	this.properties = {
		continuous: true,
		mark: -1
	};

	this.addInput("freqs","array");
	this.addInput("mark","number");
	this.size = [300,200];
	this._last_buffer = null;
}

LGAudioVisualization.prototype.onExecute = function()
{
	this._last_buffer = this.getInputData(0);
	var v = this.getInputData(1);
	if(v !== undefined)
		this.properties.mark = v;
	this.setDirtyCanvas(true,false);
}

LGAudioVisualization.prototype.onDrawForeground = function(ctx)
{
	if(!this._last_buffer)
		return;

	var buffer = this._last_buffer;

	//delta represents how many samples we advance per pixel
	var delta = buffer.length / this.size[0];
	var h = this.size[1];

	ctx.fillStyle = "black";
	ctx.fillRect(0,0,this.size[0],this.size[1]);
	ctx.strokeStyle = "white";
	ctx.beginPath();
	var x = 0;

	if(this.properties.continuous)
	{
		ctx.moveTo(x,h);
		for(var i = 0; i < buffer.length; i+= delta)
		{
			ctx.lineTo(x,h - (buffer[i|0]/255) * h);
			x++;
		}
	}
	else
	{
		for(var i = 0; i < buffer.length; i+= delta)
		{
			ctx.moveTo(x+0.5,h);
			ctx.lineTo(x+0.5,h - (buffer[i|0]/255) * h);
			x++;
		}
	}
	ctx.stroke();

	if(this.properties.mark >= 0)
	{
		var samplerate = LGAudio.getAudioContext().sampleRate;
		var binfreq = samplerate / buffer.length;
		var x = 2 * (this.properties.mark / binfreq) / delta;
		if(x >= this.size[0])
			x = this.size[0]-1;
		ctx.strokeStyle = "red";
		ctx.beginPath();
		ctx.moveTo(x,h);
		ctx.lineTo(x,0);
		ctx.stroke();
	}
}

LGAudioVisualization.title = "Visualization";
LGAudioVisualization.desc = "Audio Visualization";
LiteGraph.registerNodeType("audio/visualization", LGAudioVisualization);


function LGAudioBandSignal()
{
	//default 
	this.properties = {
		band: 440,
		amplitude: 1
	};

	this.addInput("freqs","array");
	this.addOutput("signal","number");
}

LGAudioBandSignal.prototype.onExecute = function()
{
	this._freqs = this.getInputData(0);
	if( !this._freqs )
		return;

	var band = this.properties.band;
	var v = this.getInputData(1);
	if(v !== undefined)
		band = v;

	var samplerate = LGAudio.getAudioContext().sampleRate;
	var binfreq = samplerate / this._freqs.length;
	var index = 2 * (band / binfreq);
	var v = 0;
	if( index < 0 )
		v = this._freqs[ 0 ];
	if( index >= this._freqs.length )
		v = this._freqs[ this._freqs.length - 1];
	else
	{
		var pos = index|0;
		var v0 = this._freqs[ pos ];
		var v1 = this._freqs[ pos+1 ];
		var f = index - pos;
		v = v0 * (1-f) + v1 * f;
	}

	this.setOutputData( 0, (v/255) * this.properties.amplitude );
}

LGAudioBandSignal.prototype.onGetInputs = function()
{
	return [["band","number"]];
}

LGAudioBandSignal.title = "Signal";
LGAudioBandSignal.desc = "extract the signal of some frequency";
LiteGraph.registerNodeType("audio/signal", LGAudioBandSignal);



function LGAudioDestination()
{
	this.audionode = LGAudio.getAudioContext().destination;
	this.addInput("in","audio");
}


LGAudioDestination.title = "Destination";
LGAudioDestination.desc = "Audio output";
LiteGraph.registerNodeType("audio/destination", LGAudioDestination);




})( window );