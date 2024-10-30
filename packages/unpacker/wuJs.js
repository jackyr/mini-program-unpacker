const wu = require("./wuLib.js");
const path = require("path");
const UglifyJS = require("uglify-es");
const {js_beautify} = require("js-beautify");
const {VM} = require('vm2');
const { logger } = require('@mini-program-unpacker/common');

function jsBeautify(code) {
    return UglifyJS.minify(code, {
        mangle: false, 
        compress: false, 
        output: {
            beautify: true, 
            comments: true
        }
    }).code;
}

function splitJs(name, cb, mainDir) {
    let isSubPkg = mainDir && mainDir.length > 0;
    let dir = path.dirname(name);
    if (isSubPkg) {
        dir = mainDir;
    }
    
    wu.get(name, code => {
        try {
            let needDelList = {};
            let vm = new VM({
                sandbox: {
                    require() {},
                    define(name, func) {
                        try {
                            let code = func.toString();
                            code = code.slice(code.indexOf("{") + 1, code.lastIndexOf("}") - 1).trim();
                            let res = jsBeautify(code);
                            
                            needDelList[path.resolve(dir, name)] = -8;
                            wu.save(path.resolve(dir, name), jsBeautify(res));
                        } catch(e) {
                            logger.logWarn(`处理${path.basename(name)}时出错: ${e.message}`);
                        }
                    },
                    definePlugin() {},
                    requirePlugin() {}
                }
            });

            if (isSubPkg) {
                code = code.slice(code.indexOf("define("));
            }

            vm.run(code);
            if (!needDelList[name]) needDelList[name] = 8;
            cb(needDelList);
        } catch(e) {
            console.log(`[错误] 处理${path.basename(name)}失败: ${e.message}`);
            cb({[name]: 8});
        }
    });
}

module.exports = {
    jsBeautify,
    wxsBeautify: js_beautify,
    splitJs
};
