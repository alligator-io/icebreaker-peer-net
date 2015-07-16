var _ = require('icebreaker')
var net = require('net')
var fs = require('fs')

if (!_.peer) require('icebreaker-peer')

function isString(obj){
  return typeof obj === 'string'
}

function isPath(p) {
  return isString(p) && isNaN(p)
}

if (!_.peers) _.mixin({
  peers: {}
})

_.mixin({
  net: _.peer({
    name: 'net',
    auto: true,
    start: function () {
      var self=this
      this.server = net.createServer(function(o){
        o.setKeepAlive(true)
        o.setNoDelay(true)
        var c = _.pair(o)
        c.address = o.remoteAddress
        c.port = o.remotePort
        self.connection(c)
      })

      this.server.on('error', function (err) {
        if (isPath(self.port) && err.code === 'EADDRINUSE') {
          var socket = net.Socket()

          socket.on('error', function (err) {
            if (err.code === 'ECONNREFUSED') {
              fs.unlink(self.port, function (err) {
                if (err)
                  _(
                    'cannot remove unix socket ' + self.port,
                    _.log(process.exit.bind(null, 1), 'emerg')
                  )
                listen()
              })
            }
            else if (err.code==='ENOENT') {
              listen()
            }
          })

          socket.connect(self.port, function () {
            _(
              'peer ' + self.name + ' port ' + self.port +
              ' is already in use by another process.',
              _.log(process.exit.bind(null, 1), 'emerg')
            )
          })

          return
        }

        _(
        ['cannot start peer' + self.name + ' on port ' + self.port, err],
          _.log(process.exit.bind(null, 1), 'emerg')
        )
      })

      var listen = function (onListening) {
        self.server.listen(
          self.port, isPath(self.port) ? null :
          self.address, onListening
        )
      }

      listen(function () {
        if (isPath(self.port)) fs.chmod(self.port, 0777)
        self.emit('started')
      })
    },

    connect: function (params) {
      var self = this

      var o = net.createConnection(isPath(params.port) ?
        params.port : {
          port: params.port,
          host: params.address
        }
      )

      o.setKeepAlive(true)
      o.setNoDelay(true)

      function emit(c){
        c.direction = params.direction
        if(params.hostname)c.hostname = params.hostname
        c.address = o.remoteAddress||params.address
        if(isPath(c.port))c.address = c.address||self.address
        c.port = o.remotePort||params.port
        self.connection(c)
      }

      function handle(err){
        o.removeListener('error',handle)
        o.removeListener('connect',handle)
        if(err)return emit({ source:_.error(err), sink:_.drain()})
        emit(_.pair(o))
      }

      o.on('error',handle)
      o.on('connect',handle)
    },

    stop: function() {
      var self = this
      try {
        self.server.close(function(){ self.emit('stopped')  })
      }
      catch (e) {
        _([e], _.log(function () {
          self.emit('stopped')
        }, 'error'))
      }
    }
  })
  },
  _.peers)
