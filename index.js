const http = require('http');
const https = require('https');

const IP = '0.0.0.0'; // 请根据需要修改 IP 地址
const PORT = 80; // 请根据需要修改端口号

// 辅助函数：将数字四舍五入到小数点后三位
function roundToThree(num) {
    return Math.round(num * 1000) / 1000;
}

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

                    // 先映射生成新数组，然后过滤掉 input 或 output 小于 0 的条目
                    const jsonB = modelsArray.map(item => {
                        const model = item.id;
                        // 计算 input 和 output
                        let input = parseFloat(item.pricing.prompt) * 1000 / 0.002;
                        let output = parseFloat(item.pricing.completion) * 1000 / 0.002;
                        
                        // 四舍五入到小数点后三位
                        input = roundToThree(input);
                        output = roundToThree(output);
                        
                        return {
                            model: model,
                            type: "tokens",
                            channel_type: 1,
                            input: input,
                            output: output
                        };
                    }).filter(item => item.input >= 0 && item.output >= 0);

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
