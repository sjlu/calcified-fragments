var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var _ = require('lodash')
var config = require('../config')
var FRAGS = require('./cards')

module.exports = function(SYSTEM, USER) {

  return Promise
    .resolve()
    .bind({})
    .then(function() {
      return request.getAsync("http://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/"+SYSTEM+"/"+USER+"/", {
        headers: {
          'X-API-Key': config.BUNGIE_API_KEY
        },
        json: true
      })
    })
    .spread(function(response, body) {

      var user = _.first(body.Response)
      this.membershipId = user.membershipId

      return request.getAsync("http://www.bungie.net/Platform/Destiny/Vanguard/Grimoire/"+SYSTEM+"/"+this.membershipId+"/", {
        headers: {
          'X-API-Key': config.BUNGIE_API_KEY
        },
        json: true
      })
    })
    .spread(function(response, body) {
      this.cards = _.filter(body.Response.data.cardCollection, function(card) {
        return _.contains(FRAGS, card.cardId)
      })

      return request.getAsync("http://www.bungie.net/Platform/Destiny/Vanguard/Grimoire/Definition/", {
        headers: {
          'X-API-Key': config.BUNGIE_API_KEY
        },
        json: true
      })
    })
    .spread(function(response, body) {

      var have = _.pluck(this.cards, "cardId")

      var cards = []

      var themes = body.Response.themeCollection
      _.each(themes, function(theme) {
        _.each(theme.pageCollection, function(page) {
          _.each(page.cardCollection, function(card) {
            if (_.contains(FRAGS, card.cardId)) {
              var cardData = _.pick(card, ["cardId", "cardName"])
              cardData.have = _.contains(have, cardData.cardId)
              cards.push(cardData)
            }
          })
        })
      })

      return cards

    })

}
