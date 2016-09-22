var Promise = require('bluebird')
var _ = require('lodash')
var bungieLookup = require('./bungie_lookup')
var inspect = require('./inspect')
var sivaIds = require('./siva_ids')
var sivaGroupNames = require('./siva_group_names')

var groupMap = {}
var cardOrder = {}
var count = 0
_.each(sivaIds, function(ids, groupName) {
  _.each(ids, function(id) {
    groupMap[id] = groupName
    cardOrder[id] = count++
  })
})

module.exports = function (SYSTEM, USER) {
  return bungieLookup.getUserMappedCards(SYSTEM, USER)
    .then(function(cardDetails) {
      return _.chain(cardDetails)
        .map(function (card) {
          if (groupMap[card.cardId]) {
            card.group = groupMap[card.cardId]
            card.order = cardOrder[card.cardId]
            return card
          }
        })
        .compact()
        .sortBy(function(card) {
          return card.order
        })
        .groupBy("group")
        .map(function(cards, group) {
          return {
            name: sivaGroupNames[group],
            cards: cards
          }
        })
        .value()
    })
}
