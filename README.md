# node-red-contrib-speakerpi
===================================
A <a href="http://nodered.org" target="_new">Node-RED</a> node to give a provided sound (WAV,OGG) out on the defined output (hdmi or chinch or defined).
This node is designed to work on Raspberry Pi and will be good in using with Watson APIs like text-to-speach to demonstrate cognitive iot.

Install
-------

Run the following command in the root directory of your Node-RED install or home directory (usually ~/.node-red).

        npm install node-red-node-speakerpi

### Additionally you have to install on the Raspberry Pi 
sudo apt-get update 
sudo apt-get install libasound2-dev

### sound set to Analog output
amixer cset numid=3 1

### sound set to HDMI
amixer cset numid=3 2

### sound set volume
alsamixer 


Usage
-----

Provides a sound-node for sending out a sound to the connected speaker. 

### speakerPi output node

The msg.speach as an input contains the WAV/OGG .

The node also needs a defined sound configuration which contains channels (1 or 2), the bitdepth (8 or 16) and the samplerate (22050 or 44100) set in the node or in the msg.speakerConfig for the sound in msg.speach. 

```
speakerConfig = { 
	channels: 1
	bitdepth: 16
	samplerate: 22050
	 }
```

