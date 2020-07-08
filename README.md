# node-red-contrib-speakerpi

A <a href="http://nodered.org" target="_new">Node-RED</a> node to give a provided sound (WAV,OGG) out on the defined output (hdmi or chinch or defined) on an Rasperry Pi with a speaker attached.
Although this node is good in using with IBM Watson APIs like <b>text-to-speach</b> to demonstrate Cognitive APIs and IoT. See <a href="https://console.bluemix.net/developer/watson/services" target="_new">IBM Cloud</a> for more information.

## Install

Run the following command in the root directory of your Node-RED install or home directory (usually ~/.node-red).

```sh
        npm install node-red-contrib-speakerpi
```

### Additionally you have to install on the Raspberry Pi 
```sh
	sudo apt-get install libasound2-dev
```

### sound set to Analog output
```sh
	amixer cset numid=3 1
```

### sound set to HDMI
```sh
	amixer cset numid=3 2
```

### sound set volume
```sh
	alsamixer
```

## Usage of the speakerpi output node

Speakerpi provides a sound-node for sending out a sound object to the connected speaker.
To use this node with the IBM Cloud Watson Services <b>msg.speech</b> as an input contains the WAV/OGG .

As an output you will get the complete message object as before after playing the sound object.

### Filebased

Within the filebased mode the buffer is dumped to an file and the Raspberry Pi Player APLAY is called in background with this file. This brings out best quality with minimum resources needed from the play.
The msg.speech should contain the WAV/OGG file (mybe directly from Text2Speach Service from IBM Cloud). This will be dumped into a file and after playing the temporary file it will be deleted.

### Givenfile

You can also play own pregiven files by using <b>msg.filename</b> (like /path/filename.wav). The <b>msg.choose</b> has then set to "givenfile" and <b>msg.filename</b> to the name with path.

### Streambased

The streambased mode is for streaming directly the buffer into a speaker framework (using node-speaker) which is from the quality perspective not very good.

The node also needs a defined sound configuration which contains channels (1 or 2), the bitdepth (8 or 16)and the samplerate (11025, 22050 or 44100) set in the node or in the <b>msg.speakerConfig</b> for the sound in <b>msg.speech</b>.

```javascript
	speakerConfig = {
		channels: 1
		bitdepth: 16
		samplerate: 22050
		}
```

### Additional Info
This node runs fine now with the NodeJS 12.x LTS, NPM v6 and NodeRed v1.1.