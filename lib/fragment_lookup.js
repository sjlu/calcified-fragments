var Promise = require('bluebird')
var _ = require('lodash')
var fragmentIds = require('./fragment_ids')
var bungieLookup = require('./bungie_lookup');
var inspect = require('./inspect')

module.exports = function(SYSTEM, USER) {
  return bungieLookup.getUserMappedCards(SYSTEM, USER, true)
    .then(function(cardDetails) {

      return _.filter(cardDetails, function(card) {
        return _.contains(fragmentIds, card.cardId)
      })
    })
    .map(function(card) {
      var romanNumeral = card.cardName.split(":")
      romanNumeral = romanNumeral[0]

      if (!card.link) {
        card.link = "http://www.ign.com/wikis/destiny/Calcified_Fragments#" + romanNumeral
      }
      return card
    })
}
