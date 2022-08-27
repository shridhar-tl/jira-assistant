const Net = require('net');

module.exports = {
    init: (onInit) => {
        const port = getAvailablePort();
        listenOnPort(port, onInit);
    }
};

function getAvailablePort() {
    return 3481;
}

function listenOnPort(port, onInit) {
    return new Promise((resolve, reject) => {
        try {
            const server = new Net.Server();
            // The server listens to a socket for a client to make a connection request.
            // Think of a socket as an end point.
            server.listen(port, function () {
                onInit(`http://localhost:${port}/auth`, () => server.destroy());
            });

            server.on('connection', function (socket) {
                socket.on('data', function (chunk) {
                    try {
                        const data = chunk.toString();
                        const finder = '/auth?';
                        let startIndex = data.indexOf(finder);
                        if (startIndex > 0) { startIndex += finder.length; }
                        const endIndex = data.indexOf(' HTTP/', startIndex);
                        const dataUri = data.substring(startIndex, endIndex);
                        resolve(dataUri);
                        socket.destroy();
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        } catch (err) {
            reject(err);
        }
    });
}