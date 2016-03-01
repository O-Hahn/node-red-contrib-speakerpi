/**
 * Copyright 2015 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * Authors:
 *    - Olaf Hahn
 **/


// give the stream out on the audio 
function speakOutput(node, outStream) {
	// include needed libs
	var Readable = require('stream').Readable;
	var Speaker = require("speaker");
	
	// Create the Speaker instance
	var speaker = new Speaker({
	  channels: node.channel,          // 2 channels
	  bitDepth: node.bitdepth,         // 16-bit samples
	  sampleRate: node.samplerate     // 44,100 Hz sample rate
	});

	// make buffer streamable 
	var rs = new Readable;
	rs.push(outStream);
	rs.push(null);
 	
    // send file to output
    rs.pipe(speaker);
};

module.exports = function(RED) {
    "use strict";
    
    var settings = RED.settings;
    var events = require("events");
    var serialp = require("serialport");
    var bufMaxSize = 32768;  // Max serial buffer size, for inputs...

    // SpeakerPI Output Node
    function SpeakerPiOutputNode(config) {
    	// Create this node
        RED.nodes.createNode(this,config);
        
        // set parameters and save locally 
		this.channel =  config.channel;
		this.bitdepth =  config.bitdepth;
		this.samplerate =  config.samplerate;
		this.name =  config.name;

		var node = this;
		
        // if there is an new input
        node.on("input",function(msg) {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});

            // check if speech is filled or standard-sound given
			if (msg.speech) {
				speakOutput(node, msg.speech);    					
			} else {
				node.error("SpeakerPI: No msg.speech object found")
			}
            node.status({fill:"green",shape:"ring",text:"node-red:common.status.connected"});
        });
        
        // SpeakerPi is ready
        node.on('ready', function() {
            node.status({fill:"green",shape:"ring",text:"node-red:common.status.connected"});
        });
        
        // SpeakerPi is closed
        node.on('closed', function() {
            node.status({fill:"red",shape:"ring",text:"node-red:common.status.not-connected"});
        });
            
        // SpeakerPi has a close 
        this.on("close", function(done) {
            done();
        });
    }
	RED.nodes.registerType("speakerpi-output",SpeakerPiOutputNode);

}
