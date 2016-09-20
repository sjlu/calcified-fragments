var Promise = require('bluebird')
var _ = require('lodash')
var sivaIds = require('./siva_ids')
var bungieLookup = require('./bungie_lookup')
var inspect = require('./inspect')

module.exports = function (SYSTEM, USER) {
  return bungieLookup.getUserMappedCards(SYSTEM, USER)
    .then(function(cardDetails) {
      return _.filter(cardDetails, function(card) {
        return _.contains(sivaIds, card.cardId)
      })
    })
}
