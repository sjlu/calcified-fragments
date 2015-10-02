#!/usr/bin/env node
var pm2 = require('pm2');

var instances = process.env.WEB_CONCURRENCY || -1;
var maxMemory = process.env.WEB_MEMORY || 512;
var dynoName = process.env.DYNO || "dev";

console.log('DYNO: %s', dynoName)
console.log('WEB_CONCURRENCY: %s', instances)
console.log('WEB_MEMORY: %s', maxMemory)

pm2.connect(function() {
  pm2.start({
    script    : 'bin/www',
    name      : 'web',
    exec_mode : 'cluster',
    instances : instances,
    max_memory_restart : maxMemory + 'M'
  }, function(err) {
    if (err) {
      return console.error(err.stack || err);
    }

    pm2.launchBus(function(err, bus) {
      if (err) {
        return console.error(err.stack || err);
      }

      bus.on('log:out', function(packet) {
        console.log(packet.data);
      });
      bus.on('log:err', function(packet) {
        console.error(packet.data);
      });
    });
  });
});