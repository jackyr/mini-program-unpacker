const path = require('path');
const os = require('os');
const fs = require('fs');
const yargs = require('yargs');
const finder = require('@mini-program-unpacker/finder');
const decrypter = require('@mini-program-unpacker/decrypter');
const unpacker = require('@mini-program-unpacker/unpacker');
const { logger } = require('@mini-program-unpacker/common');

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
    default: path.join(
      os.homedir(),
      'Documents/unpack_wxapkg_output'
    ),
  })
  .option('wxid', {
    type: 'string',
    description: '小程序ID（处理单个文件时可选）'
  })
  .option('watch', {
    alias: 'w',
    type: 'boolean',
    description: '监听输入目录变动',
    default: false
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

// 文件监听功能
function watchInput(inputPath) {
  logger.log(logger.LOG_FORMAT.INFO, '开始监听文件变动...');
  
  fs.watch(inputPath, { recursive: true }, async (eventType, filename) => {
    logger.log(logger.LOG_FORMAT.INFO, `检测到文件变动: ${filename}`);
    await startProcess();
  });
}

// 开始处理流程
async function startProcess() {
  try {
    const outputPath = argv.output.startsWith('~') 
      ? path.join(os.homedir(), argv.output.slice(1))
      : path.resolve(argv.output);
    
    // 确保输出目录存在
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const inputType = getInputType(argv.input);
    const rawDir = path.join(outputPath, 'raw');
    const decDir = path.join(outputPath, 'dec');
    const unpackDir = path.join(outputPath, 'unpack');

    if (inputType === 'directory') {
      // 目录处理流程
      logger.log(logger.LOG_FORMAT.START, '查找wxapkg文件...');
      await finder.processWxapkgs(argv.input, rawDir);
      logger.log(logger.LOG_FORMAT.DONE, '查找wxapkg文件完成');

      logger.log(logger.LOG_FORMAT.START, '解密wxapkg文件...');
      await decrypter.decrypt(rawDir, decDir);
      logger.log(logger.LOG_FORMAT.DONE, '解密wxapkg文件完成');

      logger.log(logger.LOG_FORMAT.START, '解包wxapkg文件...');
      await unpacker.processPath(decDir, unpackDir);
      logger.log(logger.LOG_FORMAT.DONE, '解包wxapkg文件完成');
    } else {
      // 单文件处理流程
      fs.mkdirSync(decDir, { recursive: true });
      fs.mkdirSync(unpackDir, { recursive: true });

      logger.log(logger.LOG_FORMAT.START, '处理wxapkg文件...');
      const rawFile = await finder.processWxapkgs(argv.input, rawDir, { wxid: argv.wxid });
      logger.log(logger.LOG_FORMAT.DONE, '处理wxapkg文件完成');

      logger.log(logger.LOG_FORMAT.START, '解密wxapkg文件...');
      const decFile = path.join(decDir, path.basename(rawFile));
      const actualDecFile = await decrypter.processFile(rawFile, decFile, { wxid: argv.wxid });
      logger.log(logger.LOG_FORMAT.DONE, '解密wxapkg文件完成');

      logger.log(logger.LOG_FORMAT.START, '解包wxapkg文件...');
      await unpacker.wxappUnpackerPkg(actualDecFile, unpackDir);
      logger.log(logger.LOG_FORMAT.DONE, '解包wxapkg文件完成');
    }

    logger.log(logger.LOG_FORMAT.DONE, '所有处理完成!');
    console.log(`输出目录: ${argv.output}，目录结构如下：`);
    console.log('raw/ - 原始wxapkg文件');
    console.log('dec/ - 解密后的wxapkg文件');
    console.log('unpack/ - 解包后的源代码文件');
  } catch (err) {
    console.error('处理过程出错:', err);
    logger.log(logger.LOG_FORMAT.ERROR, err.message);
  }
}

async function main() {
  await startProcess();

  // 如果开启了监听模式，则启动文件监听
  if (argv.watch) {
    watchInput(argv.input);
  }
}

main();
