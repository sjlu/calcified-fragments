var express = require('express');
var router = express.Router();
var fragmentLookup = require('../lib/fragment_lookup');
var ghostLookup = require('../lib/ghost_lookup')
var _ = require('lodash')
var errors = require('../errors')

router.use(function(req, res, next) {

  var host = req.get('host');
  var type = req.query.type;

  if (type) {
    if (type === 'ghosts') {
      res.locals.type = 'ghosts'
    } else if (type === 'fragments') {
      res.locals.type = 'fragments'
    } else {
      next(new errors.NotFound("Unrecognized type, must be 'ghosts' or 'fragments'"))
    }
  } else if (host.indexOf("destinydeadghosts.com") > -1) {
    res.locals.type = 'ghosts'
  } else if (host.indexOf("destinycalcifiedfragments.com") > -1) {
    res.locals.type = 'fragments'
  } else {
    res.locals.type = 'fragments'
  }

  if (res.locals.type === 'ghosts') {
    res.locals.title = 'Dead Ghosts'
  } else if (res.locals.type === 'fragments') {
    res.locals.title = 'Calcified Fragments'
  }

  return next()

})

router.get('/', function(req, res) {
  res.render('index');
});

router.post('/', function(req, res) {

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

var renderFragments = function(req, res, next) {
  fragmentLookup(req.params.system, req.params.username)
    .then(function(cards) {

      var completed = _.filter(cards, function(card) {
        return card.have
      })

      // format it to the display we require
      var sections = [{
        cards: cards
      }]

      res.render('display', {
        sections:sections,
        done:completed.length,
        total:cards.length
      })
    })
    .catch(next)
}

var renderGhosts = function(req, res, next) {
  ghostLookup(req.params.system, req.params.username)
    .then(function(sections) {
      res.render('display', {
        sections: sections
      })
    })
}

router.get('/:platform/:username', function(req, res, next) {
  var system = 0
  if (req.params.platform === "xbox") {
    system = 1
  } else if (req.params.platform === "psn") {
    system = 2
  }
  req.params.system = system

  if (res.locals.type === 'ghosts') {
    renderGhosts(req, res, next)
  } else if (res.locals.type === 'fragments') {
    renderFragments(req, res, next)
  } else {
    next(new errors.NotFound())
  }
})

module.exports = router;
