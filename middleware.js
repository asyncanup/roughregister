module.exports = function (app) {
    app.socket.on("connection", function (socket) {
        socket.emit("from root");
    });
};
