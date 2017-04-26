var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var _ = require('lodash')
var config = require('../config')
var ghostIds = require('./ghost_ids');
var bungieLookup = require('./bungie_lookup');
var ghostGroupNames = require('./ghost_group_names')
var ghostExpansions = require('./ghost_expansions')
var winston = require('./winston')

var ghostIdsReverseMap = {}
var ghostIdsOrder = {}
var count = 0
_.each(ghostIds, function(ghostIds, groupName) {
  _.each(ghostIds, function(ghostId) {
    ghostIdsReverseMap[ghostId] = groupName
    ghostIdsOrder[ghostId] = count++
  })
})

module.exports = function (SYSTEM, USER) {
  return bungieLookup.getUserMappedCards(SYSTEM, USER)
    .then(function(cardDetails) {
      return _.chain(cardDetails)
        .map(function(card) {
          if (ghostIdsReverseMap[card.cardId]) {
            card.group = ghostIdsReverseMap[card.cardId]
            card.order = ghostIdsOrder[card.cardId]
            card.expansion = ghostExpansions[card.cardId] || ""

            return card
          }

          winston.verbose(card.cardId, _.pick(card, ['cardName']))
        })
        .compact()
        .sortBy(function(card) {
          return card.order
        })
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
