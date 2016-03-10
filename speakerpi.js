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
function speakOutput(outStream, speakerConfig) {
	// include needed libs
	var Readable = require('stream').Readable;
	var Speaker = require("speaker");
	
	// Create the Speaker instance
	var speaker = new Speaker({
	  channels: speakerConfig.channels,          // 2 channels
	  bitDepth: speakerConfig.bitdepth,         // 16-bit samples
	  sampleRate: speakerConfig.samplerate     // 44,100 Hz sample rate
	});

	// make buffer streamable 
	var rs = new Readable;
	rs.push(outStream);
	rs.push(null);
 	
    // send file to output
    rs.pipe(speaker);
};

function speakOutputFile(outStream, speakerConfig) {
	var Sound = require('node-aplay');
 	var fs = require("fs-extra");
 	var os = require("os");
 	
 	var cdat = new new Date().toISOString().replace('T', '-').substr(0, 19);
 	var filename = "/furbyspeak/speak-" + cdat +".wav";#
  	
	var data = outStream;
 		
 	console.log("SpeakOutputFile:"+ filename);
 	
	if ((typeof data === "object") && (!Buffer.isBuffer(data))) {
 			 data = JSON.stringify(data);
		}
    if (typeof data === "boolean") { data = data.toString(); }
    if (typeof data === "number") { data = data.toString(); }
    if (!Buffer.isBuffer(data)) { data += os.EOL; }
         
    data = new Buffer(data);
          
     // using "binary" not {encoding:"binary"} to be 0.8 compatible for a while
     fs.writeFile(filename, data, "binary", function (err) {
         if (err) {
             if (err.code === "ENOENT") {
                 fs.ensureFile(filename, function (err) {
                     if (err) { 
                     	console.error("Furby Speak (err): File "+ filename + " could not be created");
                     }
                     else {
                         fs.writeFile(filename, data, "binary", function (err) {
                             if (err) { 
                             	console.error("Furby Speak (err): File " + filename + " could not be written to");
                             	}
                         });
                     }
                 });
             }
             else { 
             	console.error("Furby Speak (err): error writing " + err);
             }
         }
         else { 
         	console.log("Furby Speak (log): File " + filename + " written.");
         	}
     });

	// fire and forget: 
	new Sound(filename).play();

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
		this.channels =  config.channels;
		this.bitdepth =  config.bitdepth;
		this.samplerate =  config.samplerate;
		this.choose = config.choose;
		this.name =  config.name;

		var node = this;
		
        // if there is an new input
        node.on("input",function(msg) {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});

            // check if speech is filled or standard-sound given
			if (msg.speech) {
				var speakerConfig = {
					channels: node.channels,          // 2 channels
					bitdepth: node.bitdepth,          // 16-bit samples
					samplesate: node.samplerate       // 44,100 Hz sample rate
				};
				
				if (node.choose == "filebased") { speakOutputFile(msg.speech, speakerConfig); }
				else { speakOutput(msg.speech, speakerConfig);  }
				   					
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
