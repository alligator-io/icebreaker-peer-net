# icebreaker-peer-net
[![Travis](https://img.shields.io/travis/alligator-io/icebreaker-peer-net.svg)](https://travis-ci.org/alligator-io/icebreaker-peer-net)
[![NPM](https://img.shields.io/npm/dm/icebreaker-peer-net.svg)](https://www.npmjs.com/package/icebreaker-peer-net)
## Prerequisites
```bash
npm install --save icebreaker
```
## Install
```bash
npm install --save icebreaker-peer-net
```
## Example
```javascript
var _ = require('icebreaker')
var Net = require('icebreaker-peer-net')

var muxrpc = require('muxrpc')
var os = require('os')

var manifest = {
  os:{
    hostname:'sync',
    platform:'sync',
    arch:'sync'
  },
  peer:{
    name:'sync',
    port:'sync'
  }
}

var peer1 = Net({port:5059})
peer1.on('connection',onConnection)
peer1.on('started',connectPeers)
peer1.start()


var peer2 = Net({port:5060})
peer2.on('connection',onConnection)
peer2.on('started',connectPeers)
peer2.start()

var count = 0
function connectPeers(){
  if(++count===2){
    peer1.connect(peer2)
  }
}

function onConnection(connection){
  var rpc = muxrpc(manifest,manifest)({
    os:{
      hostname:os.hostname,
      platform:os.platform,
      arch:os.arch
    },
    peer:{
      name : function(){return this.name}.bind(this),
      port : function(){return this.port}.bind(this),
    }
  })

  rpc.peer.name(function(err,name){
    console.log('\nData from peer:',name)
  })

  rpc.peer.port(function(err,port){
    console.log('port:',port)
  })

  rpc.os.hostname(function(err,hostname){
    console.log('hostname:',hostname)
  })

  rpc.os.platform(function(err,platform){
    console.log('platform:',platform)
  })

  rpc.os.arch(function(err,arch){
    console.log('arch:',arch)
  })

  _(connection,rpc.createStream(),connection)
}
```
## License
MIT
