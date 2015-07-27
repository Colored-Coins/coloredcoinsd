/*var controllers = []
var path = require('path')

require('fs').readdirSync(__dirname + '/').forEach(function(file) {
  if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
    var name = file.replace('.js', '');
    exports[name] = require('./' + file);
    // try merge file
    controllers.push(exports[name]);
  }
});

module.exports.register = function (app, swagger) {
    console.log("V3 Controllers registerd");
    //register the models
    require("../../models/v3")(swagger, 'v3');
    for (var controller in controllers) {
        //register the controllers
        controllers[controller].registerRoutes(app, path.basename(__dirname), swagger);
    }
}




*/