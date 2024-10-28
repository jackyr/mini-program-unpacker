const fs = require('fs');
const path = require('path');

function extractWxidFromPath(filePath) {
    // 从文件名中提取
    const fileName = path.basename(filePath);
    const fileMatch = fileName.match(/wx[a-f0-9]{16}/);
    if (fileMatch) return fileMatch[0];

    // 从路径中提取
    const dirPath = path.dirname(filePath);
    const pathParts = dirPath.split(path.sep);
    for (const part of pathParts) {
        const dirMatch = part.match(/wx[a-f0-9]{16}/);
        if (dirMatch) return dirMatch[0];
    }

    return null;
}

async function processWxapkgs(srcPath, destDir, options = {}) {
    // 确保目标目录存在
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    try {
        if (fs.statSync(srcPath).isFile()) {
            // 处理单个文件
            if (!srcPath.endsWith('.wxapkg')) {
                throw new Error('输入文件必须是wxapkg格式');
            }

            const wxid = options.wxid || extractWxidFromPath(srcPath);
            if (!wxid) {
                throw new Error('无法从文件路径中提取wxid，请通过 --wxid 参数指定');
            }

            // 获取文件创建时间
            const stats = fs.statSync(srcPath);
            const createTime = new Date(stats.birthtime);
            
            // 格式化时间
            const dateStr = createTime.toLocaleString('zh-CN', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit',
                hour12: false
            }).replace(/[\/\s:]/g, '');
            const timeStr = createTime.toLocaleString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            }).replace(/[\/\s:]/g, '');
            
            // 构建新文件名
            const newFileName = `${dateStr}-${timeStr}-${wxid}.wxapkg`;
            const destPath = path.join(destDir, newFileName);
            
            // 复制文件
            fs.copyFileSync(srcPath, destPath);
            console.log(`已复制: ${newFileName}`);
            return destPath; // 返回目标文件路径
        }

        // 处理目录
        const wxids = fs.readdirSync(srcPath);
        for (const wxid of wxids) {
            const wxidPath = path.join(srcPath, wxid);
            
            // 检查是否是目录且符合wxid格式
            if (!fs.statSync(wxidPath).isDirectory() || !wxid.startsWith('wx')) {
                continue;
            }
            
            // 遍历wxid下的子目录
            const subDirs = fs.readdirSync(wxidPath);
            for (const subDir of subDirs) {
                const appPath = path.join(wxidPath, subDir, '__APP__.wxapkg');
                
                // 检查文件是否存在
                if (!fs.existsSync(appPath)) {
                    continue;
                }
                
                // 获取文件创建时间
                const stats = fs.statSync(appPath);
                const createTime = new Date(stats.birthtime);
                
                // 格式化时间
                const dateStr = createTime.toLocaleString('zh-CN', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                    hour12: false
                }).replace(/[\/\s:]/g, '');
                const timeStr = createTime.toLocaleString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                }).replace(/[\/\s:]/g, '');
                
                // 构建新文件名
                const newFileName = `${dateStr}-${timeStr}-${wxid}.wxapkg`;
                const destPath = path.join(destDir, newFileName);
                
                // 复制文件
                fs.copyFileSync(appPath, destPath);
                console.log(`已复制: ${newFileName}`);
            }
        }
        console.log('处理完成！');
    } catch (err) {
        console.error('发生错误:', err);
        throw err;
    }
}

// 如果直接运行此文件，则使用命令行参数
if (require.main === module) {
    const yargs = require('yargs/yargs');
    const { hideBin } = require('yargs/helpers');
    
    const argv = yargs(hideBin(process.argv))
        .option('src', {
            alias: 's',
            type: 'string',
            description: '微信小程序源文件夹或wxapkg文件路径',
            default: path.join(process.env.HOME || process.env.USERPROFILE, 'Documents/WeChat Files/Applet')
        })
        .option('dest', {
            alias: 'd',
            type: 'string',
            description: '输出目标文件夹路径',
            default: './wxapkgs'
        })
        .option('wxid', {
            type: 'string',
            description: '小程序ID（处理单个文件时可选）'
        })
        .help()
        .argv;

    processWxapkgs(argv.src, argv.dest, { wxid: argv.wxid });
}

module.exports = {
    processWxapkgs,
    extractWxidFromPath
};
