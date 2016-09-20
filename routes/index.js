var express = require('express')
var router = express.Router()
var fragmentLookup = require('../lib/fragment_lookup')
var ghostLookup = require('../lib/ghost_lookup')
var sivaLookup = require('../lib/siva_lookup')
var _ = require('lodash')
var errors = require('../lib/errors')

router.use(function (req, res, next) {
  if (res.locals.type === 'ghosts') {
    res.locals.title = 'Dead Ghosts'
  } else if (res.locals.type === 'fragments') {
    res.locals.title = 'Calcified Fragments'
  } else if (res.locals.type === 'siva') {
    res.locals.title = 'Dormant Siva Clusters'
  }

  return next()
})

router.get('/', function (req, res) {
  res.render('index')
})

router.post('/', function (req, res) {
  var platform = 'xbox'
  if (req.body.system == 2) {
    platform = 'psn'
  }

  var gamertag = req.body.gamertag

  var url = '/' + platform + '/' + gamertag
  if (req.query.type) {
    url += '?type=' + req.query.type
  }

  res.redirect(url)
})

var renderFragments = function (req, res, next) {
  fragmentLookup(req.params.system, req.params.username)
    .then(function (cards) {
      var completed = _.filter(cards, function (card) {
        return card.have
      })

      // format it to the display we require
      var sections = [{
        cards: cards
      }]

      res.render('display', {
        sections: sections,
        done: completed.length,
        total: cards.length,
        showDetails: true
      })
    })
    .catch(next)
}

var renderGhosts = function (req, res, next) {
  ghostLookup(req.params.system, req.params.username)
    .then(function (sections) {
      res.render('display', {
        sections: sections
      })
    })
    .catch(next)
}

var renderSiva = function (req, res, next) {
  sivaLookup(req.params.system, req.params.username)
    .then(function (cards) {
      var completed = _.filter(cards, function(card) {
        return card.have
      })

      // format it to the display we require
      var sections = [{
        cards: cards
      }]

      res.render('display', {
        sections: sections,
        done: completed.length,
        total: cards.length
      })
    })
    .catch(next)
}

router.get('/:platform/:username', function (req, res, next) {
  var system = 0
  if (req.params.platform === "xbox") {
    system = 1
  } else if (req.params.platform === "psn") {
    system = 2
  }
  req.params.system = system

  res.locals.platform = req.params.platform
  res.locals.username = req.params.username

  if (res.locals.type === 'ghosts') {
    renderGhosts(req, res, next)
  } else if (res.locals.type === 'fragments') {
    renderFragments(req, res, next)
  } else if (res.locals.type === 'siva') {
    renderSiva(req, res, next)
  } else {
    next(new errors.NotFound())
  }
})

module.exports = router
