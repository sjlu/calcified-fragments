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

var handleError = function (body) {
  if (body.ErrorCode === 5) {
    throw new errors.RecoverableError("Bungie's API is undergoing maintenance")
  } else if (body.ErrorCode == 1665) {
    throw new errors.RecoverableError("Your data is private, please make it public!")
  } else if (body.ErrorCode == 1670) {
    throw new errors.RecoverableError("Your account is on Bungie's legacy platform and cannot be looked up. Maybe you're on a Xbox 360 or PS3?")
  } else if (body.ErrorStatus !== 'Success') {
    throw new Error("Bungie is returning with errors, you may want to check back later.")
  }
}

var requestUrl = function (url, retry) {
  return request.getAsync(url, {
    headers: {
      'X-API-Key': config.BUNGIE_API_KEY
    },
    json: true
  })
  .spread(function (response, body) {
    handleError(body)
    // inspect(body)
    return body.Response
  })
  .catch(function (err) {
    if (err instanceof errors.RecoverableError) {
      throw err
    }

    retry = retry || 0
    if (retry < 3) {
      return requestUrl(url, retry + 1)
    }

    throw err
  })
}

var getCharacters = function(SYSTEM, membershipId) {
  return requestUrl(BASE_URL + "/"+SYSTEM+"/Account/"+membershipId+"/Summary/")
    .then(function (resp) {
      return resp.data.characters
    })
}

var getAdvisorForCharacter = function(SYSTEM, membershipId, characterId) {
  return requestUrl(BASE_URL + "/"+SYSTEM+"/Account/"+membershipId+"/Character/"+characterId+"/Advisors")
    .then(function (resp) {
      return resp.data.checklists[0].entries
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
  return requestUrl(BASE_URL + "/Vanguard/Grimoire/"+SYSTEM+"/"+membershipId+"/")
    .then(function (resp) {
      return resp.data.cardCollection
    })
}

var getCards = function(SYSTEM, USER, perCharacter) {
  return requestUrl(BASE_URL + "/SearchDestinyPlayer/"+SYSTEM+"/"+USER+"/")
  .then(function (resp) {
    var user = _.first(resp)

    if (!user) {
      throw new errors.UserNotFound("Could not find user '" + USER + "'")
    }

    var membershipId = user.membershipId

    return Promise.all([
      getCardsForUser(SYSTEM, membershipId),
      perCharacter ? getCardsPerCharacter(SYSTEM, membershipId) : false
    ])
  })
  .spread(function(cardsForUser, cardsPerCharacter) {
    if (!cardsPerCharacter) {
      return cardsForUser
    }

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

  return requestUrl("http://www.bungie.net/Platform/Destiny/Vanguard/Grimoire/Definition/")
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

module.exports.getUserMappedCards = function(SYSTEM, USER, perCharacter) {
  return Promise
    .all([
      getCards(SYSTEM, USER, perCharacter),
      getCardDetails()
    ])
    .spread(function(userCards, cardDetails) {
      inspect(userCards)
      var userCardsIndexed = _.indexBy(userCards, "cardId")

      return _.map(cardDetails, function (card) {
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
