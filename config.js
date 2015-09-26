var _ = require('lodash');
var dotenv = require('dotenv');

// load dotenv config vars if available
dotenv.load();

var config = {
  // https://www.bungie.net/en/User/API
  BUNGIE_API_KEY: ""
};
config = _.defaults(process.env, config);

module.exports = config;