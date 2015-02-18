var net = require('net')
var fs = require('fs')
var _ = require('icebreaker')
if(!_.peer)require('icebreaker-peer')

var connection = function(original) {
  original.setKeepAlive(true)
  original.setNoDelay(true)
  this.connection(_.net(original))
}

_.mixin({
  net : function(connection) {
    var net = _.pair(connection)
    if (connection.remoteAddress) net.address = connection.remoteAddress
    if (connection.remotePort) net.port = connection.remotePort
    return net
  }
})

if (!_.peers) _.mixin({ peers : {} })

_.mixin({
  net : _.peer({
    name : 'net',
    auto : true,
    start : function() {
      var server = this.server = net.createServer(connection.bind(this))
      this.server.on('error', function(err) {
        if (typeof this.port === 'string' && err.code === 'EADDRINUSE') {
          var socket = net.Socket()

          socket.on('error', function(err) {
            if (err.code == 'ECONNREFUSED') {
              fs.unlink(this.port, function(err) {
                if (err)
                  _(
                    'cannot remove unix socket ' + this.port,
                    _.log(process.exit.bind(null, 1), 'emerg')
                  )
                listen()
              }.bind(this))
            }
          }.bind(this))

          socket.connect(this.port, function() {
            _(
              'peer ' + this.name + ' port ' + this.port +
              ' is already in use by another process.',
              _.log(process.exit.bind(null, 1), 'emerg')
            )
          }.bind(this)
          )

          return
        }

        _(
          [ 'cannot start peer' + this.name + ' on port ' + this.port, err ],
          _.log(process.exit.bind(null, 1), 'emerg')
        )
      }.bind(this))

      var onListening = function() {
        if (typeof this.port === 'string') fs.chmod(this.port, 0777)
        this.emit('started')
      }.bind(this)

      var listen = function(onListening) {
        this.server.listen(
          this.port, typeof this.port === 'string' ? null :
          this.address, onListening
        )
      }.bind(this)

      listen(onListening)
    },

    connect : function(params) {
      if (!params.address) params.address = this.address
      var c = net.createConnection( typeof params.port === 'string' ?
        params.port : {
          port : params.port,
          host : params.address
      },
      function() { connection.call(this, c) }.bind(this)
     )
    },

    stop : function stop() {
      try {
        this.server.close(function close() {
         if(Object.keys(this.connections).length>0){
          process.nextTick(function(){
            close.call(this)
          }.bind(this))
          return
          }
        else
         this.emit('stopped')
        }.bind(this))
      }
      catch (e) {
        _([ e ], _.log(function() { this.emit('stopped') }.bind(this)), 'error')
      }
    }
  })
}, _.peers)
