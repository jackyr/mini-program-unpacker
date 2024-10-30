const path = require('path');
const os = require('os');
const yargs = require('yargs');
const run = require('../index');

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
      'Documents/unpack-wxapkg-output'
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

run(argv.input, argv.output, argv.wxid, argv.watch);
