module.exports = function (sw) {
    var models = [];
    var path = require('path');

    require('fs').readdirSync(__dirname + '/').forEach(function (file) {
        if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
            var name = file.replace('.js', '');
            exports[name] = require('./' + file);
            sw.addModels(exports[name]);
            console.log("adding model: " + name);
            models.push(exports[name]);
        }
    });
}
