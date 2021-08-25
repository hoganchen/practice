var http = require("http");
var url = require("url");
const { route } = require("./router");

function start() {
    function onRequest(request, response) {
        var pathname = url.parse(request.url).pathname;
        // const url_name = new url.URL(request.url);
        // var pathname = url_name.searchParams.get('pathname');
        // console.log('url_name: ', url_name);
        console.log('request.url: ', request.url);
        console.log("Request for " + pathname + " received.");

        route(pathname);

        response.writeHead(200, {"Content-Type": "text/plain"});
        response.write("Hello World");
        response.end();
    }

    http.createServer(onRequest).listen(8888);
    console.log("Server has started.");
}

exports.start = start;