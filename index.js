var Promise = require('bluebird')
var request = Promise.promisifyAll(require('request'))
var _ = require('lodash')

// https://www.bungie.net/en/User/API
var API_KEY = "a9f16e18585f42f788f8ab78027ce570"
var SYSTEM = 1
var USER = "sluzorz"

var FRAGS = [
  700680,
  700690,
  700700,
  700710,
  700720,
  700830,
  700840,
  700850,
  700860,
  700770,
  700780,
  700790,
  700800,
  700810,
  700820,
  700830,
  700840,
  700850,
  700860,
  700870,
  700880,
  700890,
  700900,
  700910,
  700920,
  700930,
  700940,
  700950,
  700960,
  700970,
  700980,
  700990,
  701000,
  701010,
  701020,
  701030,
  701040,
  701050,
  701060,
  701070,
  701080,
  701090,
  701100,
  701110,
  701120,
  701130,
  701140,
  701150,
  701160,
  701170
]

Promise
  .resolve()
  .bind({})
  .then(function() {
    return request.getAsync("http://www.bungie.net/Platform/Destiny/SearchDestinyPlayer/"+SYSTEM+"/"+USER+"/", {
      headers: {
        'X-API-Key': API_KEY
      },
      json: true
    })
  })
  .spread(function(response, body) {

    var user = _.first(body.Response)
    this.membershipId = user.membershipId

    return request.getAsync("http://www.bungie.net/Platform/Destiny/Vanguard/Grimoire/"+SYSTEM+"/"+this.membershipId+"/", {
      headers: {
        'X-API-Key': API_KEY
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
        'X-API-Key': API_KEY
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

    console.log(cards)
    console.log(have.length)

  })

