var test = require('tape')
var _ = require('icebreaker')
require('../index.js')

test('_.peers.net should emit an error',function(t){
  var p = _.peers.net({port:'./test2.socket'})

  p.on('connection',function(connection){
    console.log('connection ',connection.address,':',connection.port)
    _(_.empty(),connection,_.onEnd(function(err){
      t.equal(err.code,'ECONNREFUSED')
      p.stop()
    }))
  })

  p.on('started',function(){
    p.connect({address:'localhost',port:'9384'})
  })

  p.on('stopped',function(){
    t.equal(this.port,'./test2.socket')
    t.equal(this.name,'net')
    t.equal(Object.keys(p.connections).length,0)
    t.end()
  })

  p.start()
})
