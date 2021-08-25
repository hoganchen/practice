var http = require("http");

http.createServer(function(request, response) {
    console.log("requst received.");
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Hello World");
    response.end();
}).listen(8888);

//命令行执行 node index.js
