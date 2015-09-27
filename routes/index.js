var express = require('express');
var router = express.Router();
var fragmentLookup = require('../lib/fragment_lookup');
var _ = require('lodash')

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.post('/', function(req, res) {

  var platform = 'xbox'
  if (req.body.system == 2) {
    platform = 'psn'
  }

  var gamertag = req.body.gamertag

  res.redirect('/' + platform + '/' + gamertag)

})

router.get('/:platform/:username', function(req, res, next) {

  var system = 0
  if (req.params.platform === "xbox") {
    system = 1
  } else if (req.params.platform === "psn") {
    system = 2
  }

  fragmentLookup(system, req.params.username)
    .then(function(cards) {

      var completed = _.filter(cards, function(card) {
        return card.have
      })

      res.render('cards', {cards:cards,done:completed.length})
    })
    .catch(next)

})

module.exports = router;
