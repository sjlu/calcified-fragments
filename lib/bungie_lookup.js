var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var errors = require('../errors')
var config = require('../config')
var _ = require('lodash');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();

var getCards = function(SYSTEM, USER) {
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
var getCardDetails = function() {
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
    return body.Response
  })
  // data normalization
  .then(function(cardDetails) {
    var cards = []
    _.each(cardDetails.themeCollection, function(theme) {
      _.each(theme.pageCollection, function(page) {
        _.each(page.cardCollection, function(card) {
          var cardData = _.pick(card, ["cardId", "cardName"])
          cardData.cardName = entities.decode(cardData.cardName)
          cards.push(cardData)
        })
      })
    })

    cardDetailsCache = cards
    return cards
  })
}

module.exports.getUserMappedCards = function(SYSTEM, USER) {

  return Promise
    .all([
      getCards(SYSTEM, USER),
      getCardDetails()
    ])
    .spread(function(userCards, cardDetails) {
      var userCardsIndexed = _.indexBy(userCards, "cardId")

      return _.map(cardDetails, function(card) {
        card.have = !!userCardsIndexed[card.cardId]
        return card
      })
    })

}