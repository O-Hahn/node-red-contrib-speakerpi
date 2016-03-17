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
	  bitDepth: speakerConfig.bitdepth,          // 16-bit samples
	  sampleRate: speakerConfig.samplerate       // 44,100 Hz sample rate
	});

	// make buffer streamable 
	var rs = new Readable;
	rs.push(outStream);
	rs.push(null);
	
    // send file to output
    rs.pipe(speaker);
	console.log("SpeakerPi (log): Sound is send to speaker.");	
	    
    return;
};

function speakOutputFile(outStream,fileopt) {
	var Sound = require('node-aplay');
 	var fs = require("fs-extra");
 	var os = require("os");
 	var uuid = require('node-uuid');
 	
 	var uuid = uuid.v4();
 	var filename = "";
  	
	var data = outStream;
 	
 	// define the standard sounds if set or temp filename
    if (fileopt) {
    	if(fileopt == "watson-1") {
    		filename = "/home/pi/.node-red/default/watson-1.wav";  
    	} else if(fileopt == "watson-2") {
    		filename = "/home/pi/.node-red/default/watson-2.wav";
    	} else if(fileopt == "watson-3") {
    		filename = "/home/pi/.node-red/default/watson-3.wav";  
    	} else if(fileopt == "watson-4") {
    		filename = "/home/pi/.node-red/default/watson-4.wav";  
    	} else if(fileopt == "watson-5") {
    		filename = "/home/pi/.node-red/default/watson-5.wav";
    	} else {
    		filename = "/home/pi/.node-red/speak/speak-" + uuid +".wav"; 
    	}
    } else {
     	filename = "/home/pi/.node-red/speak/speak-" + uuid +".wav";          
    }
    
    console.log("SpeakOutputFile:"+ filename);

    // write soundobject to file 
 	if (fileopt && fileopt == "payload") {
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
	                    	console.error("SpeakerPi (err): File "+ filename + " could not be created");
	                    	return;
	                    }
	                    else {
	                        fs.writeFile(filename, data, "binary", function (err) {
	                            if (err) { 
	                            	console.error("SpeakerPi (err): File " + filename + " could not be written to");
	                            	return;
	                            	}
	                        });
	                    }
	                });
	            }
	            else { 
	            	console.error("SpeakerPi (err): error writing " + err);
	            	return;
	            }
	        } else {
	        	console.log("SpeakerPi (log): File " + filename + " written.");
	        	
	        	// speak out the streamed file or the standard file 
	           	var speak = new Sound(filename);
	           	speak.play();
	           	
	           	speak.on('complete', function () {
	           		console.log('SpeakerPi (log): Done with playback!');

	           		// delete file - if payload given and tempfile is not needed anymore
	           		if (fileopt && fileopt == "payload") {
	           	   		fs.remove(filename, function(err) {
	                 		  if (err) return console.error("SpeakerPi (err): "+ err);
	                 		  
	                 		  console.log("SpeakerPi (log): remove success!")
	                 		});	           			
	           		}
	           	});
	        	}
	    });
 	} else {
 		// speak out the streamed file or the standard file 
 	   	var speak = new Sound(filename);
 	   	speak.play();
 	   	
 	   	speak.on('complete', function () {
 	   		console.log('SpeakerPi (log): Done with playback!');
 	   	});

 	}
   	
 	return;
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
		this.predefsound = config.predefsound;
		this.name =  config.name;

		var node = this;
		
        // if there is an new input
        node.on("input",function(msg) {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});


            // check if speech is filled or standard-sound given
			if (msg.speech) {
				if(msg.predefsound) {
					this.predefsound = msg.predefsound;
				}
				var speakerConfig = {
					channels: node.channels,          // 2 channels
					bitdepth: node.bitdepth,          // 16-bit samples
					samplesate: node.samplerate       // 44,100 Hz sample rate
				};
				
				if (node.choose == "filebased") { speakOutputFile(msg.speech,node.predefsound); }
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
