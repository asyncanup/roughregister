(function () {
    "use strict";

    module.exports = function (app) {
        app.util.initDefaultModules(require);

        log("loading " + "pipe");
        require("./pipe")(app);
    };

}());