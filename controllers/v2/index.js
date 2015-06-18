var controllers = [];
var path = require('path');

require('fs').readdirSync(__dirname + '/').forEach(function(file) {
  if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    exports[name] = require('./' + file);
    controllers.push(exports[name]);
  }
});

module.exports.register = function (app, swagger) {
    console.log("V2 Controllers registerd");
    //register the models
    require("../../models/v2")(swagger);
    for (var controller in controllers) {
        //register the controllers
        controllers[controller].registerRoutes(app, path.basename(__dirname), swagger);
    }
}
