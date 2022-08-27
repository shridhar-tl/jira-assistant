const { net } = require('electron');

module.exports = {
    execute: function (url, req) {
        return new Promise((success, fail) => {
            try {
                const hdl = setTimeout(() => fail({ message: 'Request timed out. Server did not respond on time.' }), 15000);
                const request = net.request({ url, ...req });
                request.on('response', (response) => {
                    response.on('error', (error) => {
                        clearTimeout(hdl);
                        console.log('HTTP Error:-', error);
                        fail({ status: response.statusCode, statusText: response.statusMessage, response: error });
                    });
                    response.on('data', (chunk) => {
                        clearTimeout(hdl);

                        chunk = chunk.toString();
                        try {
                            chunk = JSON.parse(chunk);
                        } catch (err) {
                            console.log('Unable to convert to JSON Obj:-', chunk);
                        }

                        if (response.statusCode >= 200 && response.statusCode < 300) {
                            success(chunk);
                        } else {
                            fail({ status: response.statusCode, statusText: response.statusMessage, response: chunk });
                        }
                    });
                });
                request.end();
            } catch (err) {
                fail(err);
            }
        });
    }
};

