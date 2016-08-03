var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var errors = require('./errors')
var config = require('../config')
var _ = require('lodash');
var Entities = require('html-entities').AllHtmlEntities;
var entities = new Entities();
var cardNotes = require('./card_notes')
var cardVideos = require('./card_videos')
var cardLinks = require('./card_links')
var inspect = require('./inspect')

var BASE_URL = "http://www.bungie.net/Platform/Destiny"

var handleError = function(body) {
  if (body.ErrorCode == 5) {
    throw new Error("Bungie's API is undergoing maintenance")
  } else if (body.ErrorCode === 1665) {
    throw new errors.RecoverableError("Your data is private, please make it public!")
  } else if (body.ErrorStatus !== 'Success') {
    throw new Error("Bungie is returning with errors, you may want to check back later.")
  }
}

var getCharacters = function(SYSTEM, membershipId) {
  return request.getAsync(BASE_URL + "/"+SYSTEM+"/Account/"+membershipId+"/Summary/", {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function(response, body) {
    handleError(body)
    // inspect(body)
    return body.Response.data.characters
  })
}

var getAdvisorForCharacter = function(SYSTEM, membershipId, characterId) {
  return request.getAsync(BASE_URL + "/"+SYSTEM+"/Account/"+membershipId+"/Character/"+characterId+"/Advisors", {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function(response, body) {
    handleError(body)
    // inspect(body.Response.data.checklists[0].entries)
    return body.Response.data.checklists[0].entries
  })
}

var getCardsPerCharacter = function(SYSTEM, membershipId) {
  return Promise
    .resolve()
    .then(function() {
      return getCharacters(SYSTEM, membershipId)
    })
    .map(function(character) {
      // going to build our own character objects
      return {
        id: character.characterBase.characterId,
        emblem_url: character.emblemPath,
        class_type: character.characterBase.classType,
        level: character.characterLevel,
        light_level: character.characterBase.powerLevel
      }
    })
    .map(function(character) {
      return getAdvisorForCharacter(SYSTEM, membershipId, character.id)
        .then(function (cards) {
          character.cards = cards
          return character
        })
    })
    .then(function (characters) {
      var cardsToChar = {}
      _.each(characters, function (character) {
        _.each(character.cards, function (card) {
          if (!card.state) {
            return
          }

          if (!cardsToChar[card.entityId]) {
            cardsToChar[card.entityId] = []
          }

          cardsToChar[card.entityId].push(_.pick(character, ['id', 'emblem_url']))
        })
      })

      return cardsToChar
    })
    .catch(errors.RecoverableError, function () {
      return false
    })
}

var getCardsForUser = function(SYSTEM, membershipId) {
  return request.getAsync(BASE_URL + "/Vanguard/Grimoire/"+SYSTEM+"/"+membershipId+"/", {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function(response, body) {
    handleError(body)
    return body.Response.data.cardCollection
  })
}

var getCards = function(SYSTEM, USER) {
  return request.getAsync(BASE_URL + "/SearchDestinyPlayer/"+SYSTEM+"/"+USER+"/", {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function(response, body) {
    handleError(body)
    var user = _.first(body.Response)

    if (!user) {
      throw new errors.UserNotFound("Could not find user '" + USER + "'")
    }

    var membershipId = user.membershipId

    return Promise.all([
      getCardsForUser(SYSTEM, membershipId),
      getCardsPerCharacter(SYSTEM, membershipId)
    ])
  })
  .spread(function(cardsForUser, cardsPerCharacter) {
    return _.map(cardsForUser, function (card) {
      card.characters = cardsPerCharacter[card.cardId]
      return card
    })
  })
}

var cardDetailsCache;
var getCardDetails = module.exports.getCardDetails = function() {
  if (cardDetailsCache) {
    return _.cloneDeep(cardDetailsCache)
  }

  return request.getAsync("http://www.bungie.net/Platform/Destiny/Vanguard/Grimoire/Definition/", {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function(response, body) {
    handleError(body)
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

    cardDetailsCache = _.cloneDeep(cards)
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
      inspect(userCards)
      var userCardsIndexed = _.indexBy(userCards, "cardId")

      return _.map(cardDetails, function(card) {
        var userCard = userCardsIndexed[card.cardId] || {}
        card.have = !!userCard.cardId
        card.characters = userCard.characters

        card.notes = cardNotes[card.cardId] || ""
        card.video = cardVideos[card.cardId] || ""
        card.link = cardLinks[card.cardId] || null
        return card
      })
    })
}
