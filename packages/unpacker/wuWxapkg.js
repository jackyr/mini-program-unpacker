const wu = require("./wuLib.js");
const wuJs = require("./wuJs.js");
const wuCfg = require("./wuConfig.js");
const wuMl = require("./wuWxml.js");
const wuSs = require("./wuWxss.js");
const path = require("path");
const fs = require("fs");
const { logger } = require('@mini-program-unpacker/common');

function header(buf) {
    const firstMark = buf.readUInt8(0);
    const lastMark = buf.readUInt8(13);
    if (firstMark != 0xbe || lastMark != 0xed) {
        throw Error("无效的文件格式");
    }
    return [buf.readUInt32BE(5), buf.readUInt32BE(9)];
}

function genList(buf) {
    const fileCount = buf.readUInt32BE(0);
    let fileInfo = [], off = 4;
    for (let i = 0; i < fileCount; i++) {
        let info = {};
        let nameLen = buf.readUInt32BE(off);
        off += 4;
        info.name = buf.toString('utf8', off, off + nameLen);
        off += nameLen;
        info.off = buf.readUInt32BE(off);
        off += 4;
        info.size = buf.readUInt32BE(off);
        off += 4;
        fileInfo.push(info);
    }
    return fileInfo;
}

function saveFile(dir, buf, list) {
    logger.log(logger.LOG_FORMAT.START, "解压文件...");
    for (let info of list) {
        wu.save(path.resolve(dir, (info.name.startsWith("/") ? "." : "") + info.name), 
            buf.slice(info.off, info.off + info.size));
    }
}

function packDone(dir, cb, order) {
    let weappEvent = new wu.CntEvent;
    let needDelete = {};
    weappEvent.encount(4);
    weappEvent.add(() => {
        wu.addIO(() => {
            if (!order.includes("d")) {
                for (let name in needDelete) {
                    if (needDelete[name] >= 8) wu.del(name);
                }
            }
            cb();
        });
    });

    function doBack(deletable) {
        for (let key in deletable) {
            if (!needDelete[key]) needDelete[key] = 0;
            needDelete[key] += deletable[key];
        }
        weappEvent.decount();
    }

    function dealThreeThings(dir, mainDir, nowDir) {
        logger.log(logger.LOG_FORMAT.PROCESS, "处理配置、脚本和模板文件...");

        if (fs.existsSync(path.resolve(dir, "app-config.json"))) {
            wuCfg.doConfig(path.resolve(dir, "app-config.json"), doBack);
        }
        if (fs.existsSync(path.resolve(dir, "app-service.js"))) {
            wuJs.splitJs(path.resolve(dir, "app-service.js"), doBack, mainDir);
        }
        if (fs.existsSync(path.resolve(dir, "workers.js"))) {
            wuJs.splitJs(path.resolve(dir, "workers.js"), doBack, mainDir);
        }
        if (mainDir) {
            if (fs.existsSync(path.resolve(dir, "page-frame.js"))) {
                wuMl.doFrame(path.resolve(dir, "page-frame.js"), doBack, order, mainDir);
            }
            wuSs.doWxss(dir, doBack, mainDir, nowDir);
        } else {
            if (fs.existsSync(path.resolve(dir, "page-frame.html"))) {
                wuMl.doFrame(path.resolve(dir, "page-frame.html"), doBack, order, mainDir);
            } else if (fs.existsSync(path.resolve(dir, "app-wxss.js"))) {
                wuMl.doFrame(path.resolve(dir, "app-wxss.js"), doBack, order, mainDir);
                if (!needDelete[path.resolve(dir, "page-frame.js")]) {
                    needDelete[path.resolve(dir, "page-frame.js")] = 8;
                }
            } else {
                logger.logError("找不到page-frame相关文件");
            }
            wuSs.doWxss(dir, doBack);
        }
    }

    if (fs.existsSync(path.resolve(dir, "app-service.js"))) {
        dealThreeThings(dir);
    } else if (fs.existsSync(path.resolve(dir, "game.js"))) {
        logger.log(logger.LOG_FORMAT.PROCESS, "处理游戏类小程序...");
        let gameCfg = path.resolve(dir, "app-config.json");
        wu.get(gameCfg, cfgPlain => {
            let cfg = JSON.parse(cfgPlain);
            if (cfg.subContext) {
                delete cfg.subContext;
                let contextPath = path.resolve(dir, "subContext.js");
                wuJs.splitJs(contextPath, () => wu.del(contextPath));
            }
            wu.save(path.resolve(dir, "game.json"), JSON.stringify(cfg, null, 4));
            wu.del(gameCfg);
        });
        wuJs.splitJs(path.resolve(dir, "game.js"), () => {
            wu.addIO(cb);
        });
    } else {
        let doSubPkg = false;
        for (const orderElement of order) {
            if (orderElement.indexOf('s=') !== -1) {
                let mainDir = orderElement.substring(2);
                let findDir = function (dir, oldDir) {
                    let files = fs.readdirSync(dir);
                    for (const file of files) {
                        let workDir = path.join(dir, file);
                        if (fs.existsSync(path.resolve(workDir, "app-service.js"))) {
                            logger.log(logger.LOG_FORMAT.PROCESS, "处理分包...");
                            mainDir = path.resolve(oldDir, mainDir);
                            dealThreeThings(workDir, mainDir, oldDir);
                            doSubPkg = true;
                            return true;
                        } else {
                            findDir(workDir, oldDir);
                        }
                    }
                };
                findDir(dir, dir);
            }
        }
        if (!doSubPkg) {
            throw new Error("检测到分包文件，请通过 -s 参数指定主包路径");
        }
    }
}

function doFile(name, cb, order, outputDir) {
    for (let ord of order) if (ord.startsWith("s=")) global.subPack = ord.slice(3);
    logger.log(logger.LOG_FORMAT.START, `解包文件: ${name}`);
    
    let dir;
    if (outputDir) {
        dir = path.join(outputDir, path.basename(name, ".wxapkg"));
    } else {
        dir = path.resolve(name, "..", path.basename(name, ".wxapkg"));
    }

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    wu.get(name, buf => {
        let [infoListLength, dataLength] = header(buf.slice(0, 14));
        if (order.includes("o")) {
            wu.addIO(console.log.bind(console), "Unpack done.");
        } else {
            wu.addIO(packDone, dir, cb, order);
        }
        saveFile(dir, buf, genList(buf.slice(14, infoListLength + 14)));
    }, {});
}

module.exports = {
    doFile: (name, cb, order, outputDir) => doFile(name, cb, order, outputDir)
};

if (require.main === module) {
    const yargs = require('yargs/yargs');
    const { hideBin } = require('yargs/helpers');
    
    const argv = yargs(hideBin(process.argv))
        .option('output', {
            alias: 'o',
            type: 'string',
            description: '解包输出目录'
        })
        .help()
        .argv;

    wu.commandExecute(
        (name, cb, order) => doFile(name, cb, order, argv.output),
        "Unpack a wxapkg file.\n\n" +
        "[-o <output_dir>] [-d] [-s=<Main Dir>] <files...>\n\n" +
        "-o <output_dir> Specify output directory\n" +
        "-d Do not delete transformed unpacked files.\n" +
        "-s=<Main Dir> Regard all packages provided as subPackages and\n" +
        "              regard <Main Dir> as the directory of sources of the main package.\n" +
        "<files...> wxapkg files to unpack"
    );
}
