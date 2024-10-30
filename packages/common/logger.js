// 添加日志格式常量
const LOG_FORMAT = {
  INFO: '[信息]',
  WARN: '[警告]',
  ERROR: '[错误]',
  START: '[开始]',
  DONE: '[完成]',
  SKIP: '[跳过]',
  PROCESS: '[进行]',
};

// 添加统一的日志输出函数
function log(type, message) {
  console.log(`${type} ${message}`);
}

function logError(message) {
  console.error(`${LOG_FORMAT.ERROR} ${message}`);
}

function logWarn(message) {
  console.warn(`${LOG_FORMAT.WARN} ${message}`);
}

module.exports = {
  log,
  logError,
  logWarn,
  LOG_FORMAT,
};
