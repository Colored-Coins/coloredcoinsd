module.exports = function (sw, version) {
    var models = [];
    var path = require('path');

    console.log('models require now')

    require('fs').readdirSync(__dirname + '/' + version + '/').forEach(function (file) {
        if (file.match(/.+\.js/g) !== null && file !== 'index.js') {
            var name = file.replace('.js', '');
            exports[name] = require('./' + version + '/' + file );
            sw.addModels(exports[name]);
            console.log("adding model: " + name);
            models.push(exports[name]);
        }
    });
}
