const path = require('path');
const fs = require('fs');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

const FILE_FORMAT = 'wxapkg';

function wxappUnpackerPkg(filePath, outDir, order = '') {
    return new Promise((resolve, reject) => {
        const wuWxapkg = require('./wuWxapkg.js');
        try {
            // 确保输出目录存在
            if (!fs.existsSync(outDir)) {
                fs.mkdirSync(outDir, { recursive: true });
            }

            // 检查目标产物目录是否已存在
            const targetDir = path.join(outDir, path.basename(filePath, '.wxapkg'));
            if (fs.existsSync(targetDir)) {
                console.log(`[跳过] ${path.basename(filePath)} - 目标目录已存在`);
                resolve();
                return;
            }

            wuWxapkg.doFile(
                filePath, 
                () => {
                    console.log(`[完成] ${path.basename(filePath)}`);
                    resolve();
                }, 
                order ? order.split(' ') : [],
                outDir
            );
        } catch (error) {
            reject(error);
        }
    });
}

function findWxapkgFiles(dir) {
    let results = [];
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            results = results.concat(findWxapkgFiles(filePath));
        } else if (file.endsWith(`.${FILE_FORMAT}`)) {
            results.push(filePath);
        }
    }
    
    return results;
}

async function processPath(inputPath, outputPath, options = {}) {
    try {
        const stat = fs.statSync(inputPath);
        
        if (stat.isDirectory()) {
            const files = findWxapkgFiles(inputPath);
            if(files.length > 0) {
                console.log(`[开始] 发现 ${files.length} 个 wxapkg 文件待处理`);
            }
            
            await Promise.all(files.map(file => 
                wxappUnpackerPkg(file, outputPath, options.order)
            ));
        } else {
            if (inputPath.endsWith(`.${FILE_FORMAT}`)) {
                await wxappUnpackerPkg(inputPath, outputPath, options.order);
            } else {
                throw new Error('输入文件必须是 .wxapkg 格式');
            }
        }
    } catch (error) {
        throw error;
    }
}

// 如果直接运行此文件
if (require.main === module) {
    const argv = yargs(hideBin(process.argv))
        .option('input', {
            alias: 'i',
            description: 'wxapkg文件或目录的路径',
            type: 'string',
            demandOption: true
        })
        .option('output', {
            alias: 'o',
            description: '解包后的输出目录',
            type: 'string',
            default: './unpacked'
        })
        .option('order', {
            description: '解包选项（例如：-d -s=/path/to/main）',
            type: 'string'
        })
        .help()
        .argv;

    processPath(argv.input, argv.output, { order: argv.order })
        .catch(error => {
            console.error('[错误]', error.message);
            process.exit(1);
        });
}

module.exports = {
    wxappUnpackerPkg,
    processPath
};
