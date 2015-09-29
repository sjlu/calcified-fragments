var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var _ = require('lodash')
var config = require('../config')
var ghostIds = require('./ghost_ids');
var bungieLookup = require('./bungie_lookup');
var ghostGroupNames = require('./ghost_group_names')

var ghostIdsReverseMap = {}
_.each(ghostIds, function(ghostIds, groupName) {
  _.each(ghostIds, function(ghostId) {
    ghostIdsReverseMap[ghostId] = groupName
  })
})

module.exports = function(SYSTEM, USER) {

  return bungieLookup.getUserMappedCards(SYSTEM, USER)
    .then(function(cardDetails) {
      return _.chain(cardDetails)
        .map(function(card) {
          if (ghostIdsReverseMap[card.cardId]) {
            card.group = ghostIdsReverseMap[card.cardId]
            return card
          }
        })
        .compact()
        .groupBy("group")
        .map(function(cards, group) {
          return {
            name: ghostGroupNames[group],
            cards: cards
          }
        })
        .value()
    })

}
