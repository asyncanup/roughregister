var sh = require('shelljs');
module.exports = function (app) {
    app.all('/redeploy', function (req, res) {
        sh.exec('git pull');
        sh.exec('npm install --unsafe-perm');
        setTimeout(function () {
            sh.exec('forever restartall');
        }, 2000);
        res.send('restarting server');
    });
};