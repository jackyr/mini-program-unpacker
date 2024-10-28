const path = require('path');
const os = require('os');
const fs = require('fs');
const yargs = require('yargs');
const finder = require('@mini-program-unpacker/finder');
const decrypter = require('@mini-program-unpacker/decrypter');
const unpacker = require('@mini-program-unpacker/unpacker');

// 配置命令行参数
const argv = yargs
  .option('input', {
    alias: 'i',
    type: 'string',
    description: '输入路径(可以是微信小程序目录或wxapkg文件)',
    default: path.join(
      os.homedir(),
      'Documents/WeChat Files/Applet'
    ),
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: '输出目录路径',
    default: './output',
  })
  .option('wxid', {
    type: 'string',
    description: '小程序ID（处理单个文件时可选）'
  })
  .help().argv;

// 判断输入类型
function getInputType(inputPath) {
  if (!fs.existsSync(inputPath)) {
    throw new Error('输入路径不存在');
  }
  
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    return 'directory';
  } else if (stat.isFile() && inputPath.endsWith('.wxapkg')) {
    return 'wxapkg';
  } else {
    throw new Error('输入文件必须是wxapkg格式');
  }
}

// 创建处理流程
async function process() {
  try {
    // 确保输出目录存在
    if (!fs.existsSync(argv.output)) {
      fs.mkdirSync(argv.output, { recursive: true });
    }

    const inputType = getInputType(argv.input);
    const rawDir = path.join(argv.output, 'raw');
    const decDir = path.join(argv.output, 'dec');
    const unpackDir = path.join(argv.output, 'unpack');

    if (inputType === 'directory') {
      // 目录处理流程
      console.log('--------------------------------');
      console.log('开始查找wxapkg文件...');
      await finder.processWxapkgs(argv.input, rawDir);
      console.log('查找wxapkg文件完成');

      console.log('--------------------------------');
      console.log('开始解密wxapkg文件...');
      await decrypter.decrypt(rawDir, decDir);
      console.log('解密wxapkg文件完成');

      console.log('--------------------------------');
      console.log('开始解包wxapkg文件...');
      await unpacker.processPath(decDir, unpackDir);
      console.log('解包wxapkg文件完成');
    } else {
      // 单文件处理流程
      fs.mkdirSync(decDir, { recursive: true });
      fs.mkdirSync(unpackDir, { recursive: true });

      console.log('--------------------------------');
      console.log('开始处理wxapkg文件...');
      const rawFile = await finder.processWxapkgs(argv.input, rawDir, { wxid: argv.wxid });
      console.log('处理wxapkg文件完成');

      console.log('--------------------------------');
      console.log('开始解密wxapkg文件...');
      const decFile = path.join(decDir, path.basename(rawFile));
      const actualDecFile = await decrypter.processFile(rawFile, decFile, { wxid: argv.wxid });
      console.log('解密wxapkg文件完成');

      console.log('--------------------------------');
      console.log('开始解包wxapkg文件...');
      await unpacker.wxappUnpackerPkg(actualDecFile, unpackDir);
      console.log('解包wxapkg文件完成');
    }

    console.log('--------------------------------');
    console.log('所有处理完成!');
    console.log(`输出目录: ${argv.output}，目录结构如下：`);
    console.log('raw/ - 原始wxapkg文件');
    console.log('dec/ - 解密后的wxapkg文件');
    console.log('unpack/ - 解包后的源代码文件');
  } catch (err) {
    console.error('处理过程出错:', err);
    process.exit(1);
  }
}

// 执行处理流程
process();
