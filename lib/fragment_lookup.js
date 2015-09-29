var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var _ = require('lodash')
var config = require('../config')
var fragmentIds = require('./fragment_ids')
var fragmentNotes = require('./fragment_notes')
var fragmentVideos = require('./fragment_videos')
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var errors = require('../errors')

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
    cardDetailsCache = body.Response
    return body.Response
  })
}

module.exports = function(SYSTEM, USER) {

  return Promise
    .all([
      getCards(SYSTEM, USER),
      getCardDetails()
    ])
    .spread(function(userCards, cardDetails) {
      var userCardIds = _.chain(userCards)
        .filter(function(card) {
          return _.contains(fragmentIds, card.cardId)
        })
        .pluck("cardId")
        .value()

      var cards = []
      _.each(cardDetails.themeCollection, function(theme) {
        _.each(theme.pageCollection, function(page) {
          _.each(page.cardCollection, function(card) {
            if (_.contains(fragmentIds, card.cardId)) {
              var cardData = _.pick(card, ["cardId", "cardName"])
              cardData.have = _.contains(userCardIds, cardData.cardId)
              cards.push(cardData)
            }
          })
        })
      })

      return cards
    })
    .map(function(card) {
      // crap names
      card.cardName = entities.decode(card.cardName)

      var romanNumeral = card.cardName.split(":")
      romanNumeral = romanNumeral[0]

      card.ign = "http://www.ign.com/wikis/destiny/Calcified_Fragments#" + romanNumeral

      card.notes = fragmentNotes[card.cardId] || ""
      card.video = fragmentVideos[card.cardId] || ""

      return card
    })

}
