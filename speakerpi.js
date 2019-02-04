/* eslint-disable no-mixed-spaces-and-tabs */
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
function speakOutput(outStream, speakerConfig, node, msg) {
	// include needed libs
	var Speaker = require("speaker");
	var Readable = require("stream").Readable;
	
	// Create the Speaker instance
	var speaker = new Speaker({
		channels: speakerConfig.channels,          // 2 channels
		bitDepth: speakerConfig.bitdepth,          // 16-bit samples
		sampleRate: speakerConfig.samplerate       // 44,100 Hz sample rate
	});
 
	if (outStream && Buffer.isBuffer(outStream)) {		
		// move it to a readable stream 
		var sbuf = new Readable();
		sbuf.push(outStream);
		sbuf.push(null);   // mark the end of the buffer which ends the stream
		
		sbuf.on("readable", function () {
			// send buffer to speaker 
			sbuf.pipe(speaker);
			//speaker.write(sbuf);
		
			speaker.on("finish", function () {
				msg.player = "done";
				node.send(msg);
				console.log("SpeakerPi (log): Done with playback!");
			});

		});


	} else {
		msg.player = "error";
		node.send(msg);
		console.error("SpeakerPi (err): Object is not a buffer");	
	}
   
	return;
}

function speakOutputFile(outStream,optfile,node,msg) {
	var Sound = require("node-aplay");
	var fs = require("fs-extra");
	var os = require("os");
	var uuidv4 = require("uuid/v4");
	var tempfile = false;

	var uuid = uuidv4();

	var localdir = __dirname;
	var filename = "";

	var data = outStream;

	// define the standard sounds if set or temp filename
	if (optfile) {
		filename = optfile;
		tempfile = false;
		
		// speak out the streamed file or the standard file 
		var speak = new Sound(filename);
		speak.play();

		speak.on("complete", function () {
			msg.player = "done";
			node.send(msg);
			console.log("SpeakerPi (log): Done with playback!");
		});

	} else {
		// create temp file
		filename = localdir + "speak-" + uuid +".wav";              	
		tempfile = true;

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
							msg.player = "error";
							node.send(msg);
							console.error("SpeakerPi (err): File "+ filename + " could not be created");
	                    	return;
	                    }
	                    else {
	                        fs.writeFile(filename, data, "binary", function (err) {
	                            if (err) { 
									msg.player = "error";
									node.send(msg);
									console.error("SpeakerPi (err): File " + filename + " could not be written to");
	                            	return;
	                            	}
	                        });
	                    }
	                });
	            }
	            else { 
					msg.player = "error";
					node.send(msg);

	            	console.error("SpeakerPi (err): error writing " + err);
	            	return;
	            }
	        } else {
	        	// console.log("SpeakerPi (log): File " + filename + " written.");
	        	
	        	// speak out the streamed file or the standard file 
	           	var speak = new Sound(filename);
	           	speak.play();
	           	
	           	speak.on("complete", function () {
	           		// console.log('SpeakerPi (log): Done with playback!');

	           		// delete file - if payload given and tempfile is not needed anymore
	           		if (tempfile) {
	           	   		fs.remove(filename, function(err) {
							if (err) return console.error("SpeakerPi (err): "+ err);
	                 		  
							// console.log("SpeakerPi (log): remove success!")
						});	           				           			
					}
					msg.player = "done";
					node.send(msg);
		  		 });
	        }
	    });
	}
    
	return;
}


module.exports = function(RED) {
	"use strict";
    
	var settings = RED.settings;
	var events = require("events");
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
		this.filename = config.filename;
		this.name =  config.name;
		this.isplaying = false;

		var node = this;
		
		// if there is an new input
		node.on("input",function(msg) {
			node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});

			// check if streambased or filebased 
			if (node.choose == "filebased") {
				var fn;
				if (node.isplaying) {
					node.error("SpeakerPI: already playing");
				} else {
					node.isplaying = true;
					speakOutputFile(msg.speech,fn, node, msg);	
					node.isplaying = false;
				}
			} else if (node.choose == "givenfile") {
				var fn = msg.filename || node.filename;
				if (node.isplaying) {
					node.error("SpeakerPI: already playing");
				} else {
					node.isplaying = true;
					speakOutputFile(msg.speech,fn, node, msg);	
					node.isplaying = false;
				}
			} else {				
				if (msg.speech) {
					var speakerConfig = {
						channels: msg.channels || node.channels,          	// 2 channels
						bitdepth: msg.bitdepth || node.bitdepth,          	// 16-bit samples
						samplerate: msg.samplerate || node.samplerate       // 44,100 Hz sample rate
					};
					if (node.isplaying) {
						node.error("SpeakerPI: already playing");
					} else {
						node.isplaying = true;
						speakOutput(msg.speech, speakerConfig, node, msg);
						node.isplaying = false;
					}
				} else {
					node.error("SpeakerPI: No msg.speech object found");
				}
			}
			
			// check if speech is filled or standard-sound given
			node.status({fill:"green",shape:"ring",text:"node-red:common.status.connected"});
		});
        
		// SpeakerPi is ready
		node.on("ready", function() {
			node.status({fill:"green",shape:"ring",text:"node-red:common.status.connected"});
		});
        
		// SpeakerPi is closed
		node.on("closed", function() {
			node.status({fill:"red",shape:"ring",text:"node-red:common.status.not-connected"});
		});
            
		// SpeakerPi has a close 
		node.on("close", function(done) {
			this.closing = true;
			done();
		});
	}
	RED.nodes.registerType("speakerpi-output",SpeakerPiOutputNode);

};
