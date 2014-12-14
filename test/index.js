var test = require('tape')
var _ = require('icebreaker')
require('../index.js')

test('_.peers.net',function(t){
  var p = _.peers.net({port:'./test.socket'})

  p.on('connect',function(params){
    console.log('connecting to ',params.address ,':', params.port)
  })

  var c =0
  p.on('connection',function(connection){
    console.log('connection ',connection.address,':',connection.port)
    ++c
    connection.c=c
    _(_.empty(),connection,_.onEnd(function(err){
      t.equal(err,null)
      if(connection.c==2)p.stop()
    }))
  })

  p.on('start',function(){
    console.log('starting peer',this.name,' on ',this.address,':',this.port)
  })

  p.on('started',function(){
    console.log('peer',this.name,' on ',this.address,':',this.port ,' started')
    p.connect(p)
    console.log('starts',this.port)
  })

  p.on('stop',function(){
    console.log('stopping peer',this.name,' on ',this.address,':',this.port ,'')
  })

  p.on('stopped',function(){
    console.log('peer',this.name,' on ',this.address,':',this.port ,' stopped')
    t.equal(this.port,'./test.socket')
    console.log(this.port)
    t.equal(this.name,'net')
    console.log(this.name)
    t.equal(Object.keys(p.connections).length,0)
    t.end()
  })

  p.start()
})