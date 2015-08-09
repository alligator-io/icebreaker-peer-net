var _ = require('icebreaker')
var net = require('net')
var fs = require('fs')
var Peer = require('icebreaker-peer')

function isString(obj) {
  return typeof obj === 'string'
}

function isPath(p) {
  return isString(p) && isNaN(p)
}

function PeerNet(params) {
  if (!(this instanceof PeerNet))
    return new PeerNet(params);

  var self = this

  var server

  Peer.call(this, {
    name : 'net',
    auto : true,
    start : function() {

      function listen(onListening) {
        server.listen(self.port, isPath(self.port) ? null : self.address,
              onListening)
      }
      if(!server){
      server = net.createServer(function(o) {
        o.setKeepAlive(true)
        o.setNoDelay(true)
        var c = _.pair(o)
        c.address = o.remoteAddress
        c.port = o.remotePort
        self.connection(c)
      })

      server.on('error', function(err) {
        if (isPath(self.port) && err.code === 'EADDRINUSE') {
          var socket = net.Socket()

          socket.on('error', function(err) {
            if (err.code === 'ECONNREFUSED') {
              fs.unlink(self.port, function(err) {
                if (err)
                  _('cannot remove unix socket ' + self.port, _.log(
                      process.exit.bind(null, 1), 'emerg'))
                listen()
              })
            } else if (err.code === 'ENOENT') {
              listen()
            }
          })

          socket.connect(self.port, function() {
            _('peer ' + self.name + ' port ' + self.port
                + ' is already in use by another process.', _.log(process.exit
                .bind(null, 1), 'emerg'))
          })

          return

        }

        _([ 'cannot start peer ' + self.name + ' on port ' + self.port, err ],
            _.log(process.exit.bind(null, 1), 'emerg'))
      })
      }

      listen(function() {
        if (isPath(self.port))
          fs.chmod(self.port, 0777)
        self.emit('started')
      })
    },

    connect : function(params) {
      var o = net.createConnection(isPath(params.port) ? params.port : {
        port : params.port,
        host : params.address
      })

      o.setKeepAlive(true)
      o.setNoDelay(true)

      function emit(c) {
        c.direction = params.direction
        if (params.hostname)
          c.hostname = params.hostname
        c.address = o.remoteAddress || params.address
        if (isPath(c.port))
          c.address = c.address || self.address
        c.port = o.remotePort || params.port
        c.peer = params.peer
        c.id = params.id
        self.connection(c)
      }

      function handle(err) {
        o.removeListener('error', handle)
        o.removeListener('connect', handle)
        if (err)
          return emit({
            source : _.error(err),
            sink : _.drain()
          })
        emit(_.pair(o))
      }

      o.on('error', handle)
      o.on('connect', handle)
    },

    stop : function() {
      try {
        server.close(function() {
          self.emit('stopped')
        })
      } catch (e) {
        _([ e ], _.log(function() {
          self.emit('stopped')
        }, 'error'))
      }
    }
  }, params)
}

var proto = PeerNet.prototype = Object.create(Peer.prototype)
module.exports = proto.constructor = PeerNet
