var express = require('express');
var router = express.Router();
var fragmentLookup = require('../lib/fragment_lookup');

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index');
});

router.post('/', function(req, res) {

  var platform = 'xbox'
  if (req.body.system === 2) {
    platform = 'ps'
  }

  var gamertag = req.body.gamertag

  res.redirect('/' + platform + '/' + gamertag)

})

router.get('/:platform/:username', function(req, res, next) {

  var system = 0
  if (req.params.platform === "xbox") {
    system = 1
  } else if (req.params.platform === "ps") {
    system = 2
  }

  fragmentLookup(system, req.params.username)
    .then(function(cards) {
      res.render('cards', {cards:cards})
    })
    .catch(next)

})

module.exports = router;
