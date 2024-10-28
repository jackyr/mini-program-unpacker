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
                console.log(`目标目录已存在，跳过解包: ${targetDir}`);
                resolve();
                return;
            }

            wuWxapkg.doFile(
                filePath, 
                () => {
                    console.log(`解包完成: ${filePath}`);
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
            console.log(`查找目录: ${inputPath}`);
            const files = findWxapkgFiles(inputPath);
            console.log(`找到 ${files.length} 个 wxapkg 文件`);
            
            await Promise.all(files.map(file => 
                wxappUnpackerPkg(file, outputPath, options.order)
            ));
        } else {
            if (inputPath.endsWith(`.${FILE_FORMAT}`)) {
                await wxappUnpackerPkg(inputPath, outputPath, options.order);
            } else {
                throw new Error('错误: 文件必须是 .wxapkg 格式');
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
            console.error('处理路径出错:', error);
            process.exit(1);
        });
}

module.exports = {
    wxappUnpackerPkg,
    processPath
};
