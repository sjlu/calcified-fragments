var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var _ = require('lodash')
var config = require('../config')
var fragmentIds = require('./fragment_ids')
var fragmentNotes = require('./fragment_notes')
var fragmentVideos = require('./fragment_videos')
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var bungieLookup = require('./bungie_lookup');

module.exports = function(SYSTEM, USER) {

  return Promise
    .all([
      bungieLookup.getCards(SYSTEM, USER),
      bungieLookup.getCardDetails()
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
