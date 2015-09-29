var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var errors = require('../errors')
var config = require('../config')
var _ = require('lodash');

module.exports.getCards = function(SYSTEM, USER) {
  return request.getAsync("http://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/"+SYSTEM+"/"+USER+"/", {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function(response, body) {
    var user = _.first(body.Response)

    if (!user) {
      throw new errors.UserNotFound("Could not find user '" + USER + "'")
    }

    return request.getAsync("http://www.bungie.net/Platform/Destiny/Vanguard/Grimoire/"+SYSTEM+"/"+user.membershipId+"/", {
      headers: {
        'X-API-Key': config.BUNGIE_API_KEY
      },
      json: true
    })
  })
  .spread(function(response, body) {
    return body.Response.data.cardCollection
  })
}

var cardDetailsCache;

module.exports.getCardDetails = function() {
  if (cardDetailsCache) {
    return cardDetailsCache
  }

  return request.getAsync("http://www.bungie.net/Platform/Destiny/Vanguard/Grimoire/Definition/", {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function(response, body) {
    cardDetailsCache = body.Response
    return body.Response
  })
}