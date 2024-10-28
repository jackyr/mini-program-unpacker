const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function extractWxidFromFilename(filename) {
    const match = filename.match(/wx[a-f0-9]{16}/);
    return match ? match[0] : null;
}

function processFile(filePath, outPath, options = {}) {
    return new Promise((resolve, reject) => {
        let wxid = options.wxid;
        const fileName = path.basename(filePath);
        const decFileName = fileName.startsWith('dec_') ? fileName : `dec_${fileName}`;
        const finalOutPath = fs.existsSync(outPath) && fs.statSync(outPath).isDirectory() 
            ? path.join(outPath, decFileName)
            : path.join(path.dirname(outPath), decFileName);
        
        // 检查目标文件是否已存在
        if (fs.existsSync(finalOutPath)) {
            console.log(`目标文件已存在，跳过解密: ${finalOutPath}`);
            resolve(finalOutPath); // 返回实际文件路径
            return;
        }

        // 如果没有提供wxid，尝试从文件名获取
        if (!wxid) {
            wxid = extractWxidFromFilename(fileName);
            if (!wxid) {
                reject(new Error(`无法从文件 ${fileName} 中获取wxid，跳过解密`));
                return;
            }
            console.log(`从文件名中获取到wxid: ${wxid}`);
        }

        fs.readFile(filePath, (err, dataByte) => {
            if (err) {
                reject(err);
                return;
            }

            // 检查文件头是否为 V1MMWX
            const fileHeader = dataByte.slice(0, 6).toString();
            if (fileHeader !== 'V1MMWX') {
                console.log(`文件 ${fileName} 不是加密的wxapkg文件，直接复制`);
                fs.copyFile(filePath, finalOutPath, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log(`复制完成: ${fileName}`);
                    resolve(finalOutPath); // 返回实际文件路径
                });
                return;
            }

            try {
                const dk = crypto.pbkdf2Sync(wxid, options.salt || 'saltiest', 1000, 32, 'sha1');
                const cipher = crypto.createDecipheriv('aes-256-cbc', dk, options.iv || 'the iv: 16 bytes');
                cipher.setAutoPadding(false);

                let originData = Buffer.concat([
                    cipher.update(dataByte.slice(6, 1030)),
                    cipher.final()
                ]);

                const afData = Buffer.alloc(dataByte.length - 1030);
                const xorKey = wxid.length >= 2 ? wxid.charCodeAt(wxid.length - 2) : 0x66;

                for (let i = 0; i < afData.length; i++) {
                    afData[i] = dataByte[1030 + i] ^ xorKey;
                }

                originData = Buffer.concat([originData.slice(0, 1023), afData]);

                fs.writeFile(finalOutPath, originData, (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    console.log(`解密成功: ${fileName}`);
                    resolve(finalOutPath); // 返回实际文件路径
                });
            } catch (error) {
                reject(error);
            }
        });
    });
}

async function decrypt(inputPath, outputPath, options = {}) {
    // 确保输出目录存在
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
    }

    try {
        const stats = fs.statSync(inputPath);
        
        if (stats.isDirectory()) {
            // 处理目录
            const files = fs.readdirSync(inputPath);
            const promises = files
                .filter(file => file.endsWith('.wxapkg'))
                .map(file => processFile(
                    path.join(inputPath, file),
                    outputPath,
                    options
                ));
            
            await Promise.all(promises);
        } else {
            // 处理单个文件
            await processFile(inputPath, outputPath, options);
        }
    } catch (error) {
        throw error;
    }
}

// 如果直接运行此文件
if (require.main === module) {
    const yargs = require('yargs');
    const argv = yargs
        .option('wxid', {
            description: '小程序的id（可选，默认从文件名获取）',
            type: 'string'
        })
        .option('iv', {
            description: 'AES加密的IV',
            type: 'string',
            default: 'the iv: 16 bytes'
        })
        .option('salt', {
            description: 'pbkdf2用到的salt',
            type: 'string',
            default: 'saltiest'
        })
        .option('in', {
            description: '需要解密的wxapkg的文件路径',
            type: 'string',
            demandOption: true
        })
        .option('out', {
            description: '解密后的wxapkg的文件路径',
            type: 'string',
            demandOption: true
        })
        .argv;

    decrypt(argv.in, argv.out, argv)
        .catch(err => {
            console.error('解密失败:', err);
            process.exit(1);
        });
}

module.exports = {
    decrypt,
    processFile
};
