var test = require('tape')
var _ = require('icebreaker')
require('../index.js')

var net = require('net')

var peer1 = _.peers.net({port:'./test1.socket'})
var peer2 = _.peers.net({port:'./test2.socket'})

test('start', function (t) {
  peer1.once('started', function () {
    t.pass('started')
    t.end()
  })

  peer1.start()
  peer2.start()
})

test('connect: peer1->peer2', function (t) {
  peer1.on('connection', function (connection) {
    t.equal(connection.type, 'net')
    t.equal(typeof connection.source, 'function')
    t.equal(typeof connection.sink, 'function')
    t.equal(typeof connection.address, 'string')
    t.equal(typeof connection.id, 'string')
    t.equal(typeof connection.port, 'string')
    t.equal(connection.direction, 1)
    t.ok(net.isIP(connection.address))
    t.equal(Object.keys(peer1.connections).length, 1)

    _(
      connection,
      _.map(function (text) {
        t.equal(text.toString(), 'hello')
        return "world"
      }),
      connection
    )
  })

  peer2.on('connection', function (connection) {
    t.equal(connection.direction, -1)
    t.test('peer2->peer1->peer2', function (t2) {

      _(
        'hello',
        connection,
        _.drain(function (data) {
            t2.equal(data.toString(), 'world')
        },
        function (err) {
          t2.notOk(err)
          t2.equal(Object.keys(peer2.connections).length, 1)
          process.nextTick(function(){
            t2.equal(Object.keys(peer1.connections).length, 0)
            t2.equal(Object.keys(peer2.connections).length, 0)
            t2.end()
          })
        })
      )
    })
  })
  peer1.connect(peer2)
})

test('stop', function (t) {
  t.plan(2)

  peer1.once('stopped', function () {
    t.pass('stopped')
  })

  peer2.once('stopped', function () {
    t.pass('stopped')
  })

  peer1.stop()
  peer2.stop()
})
