const http = require('http');
const https = require('https');

const IP = '0.0.0.0'; // Change this to your desired IP address
const PORT = 47999; // Change this to your desired port

const server = http.createServer((req, res) => {
    if (req.url === '/openrouterpricing.json') {
        // 从 https://openrouter.ai/api/v1/models 获取 JSON A
        https.get('https://openrouter.ai/api/v1/models', (resp) => {
            let data = '';

            // 接收数据块
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // 数据接收完成
            resp.on('end', () => {
                try {
                    const jsonA = JSON.parse(data);
                    const modelsArray = jsonA.data; // 访问 'data' 属性

                    const jsonB = modelsArray.map(item => {
                        const model = item.id;
                        const input = parseFloat(item.pricing.prompt) * 1000 / 0.002;
                        const output = parseFloat(item.pricing.completion) * 1000 / 0.002;
                        return {
                            model: model,
                            type: "tokens",
                            channel_type: 1,
                            input: input,
                            output: output
                        };
                    });
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(jsonB));
                } catch (e) {
                    console.error(e);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error parsing JSON data');
                }
            });

        }).on("error", (err) => {
            console.error(err);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error fetching data');
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

server.listen(PORT, IP, () => {
    console.log(`Server running at http://${IP}:${PORT}/openrouterpricing.json`);
});