module.exports.config = {
    name: "load",
    version: "1.0.0",
    hasPermssion: 3, // Chỉ Admin bot mới dùng được
    usePrefix: false,
    credits: "Mirai Team, qh và Gemini", // Thêm credit của mày và tao
    description: "Quản lý/Kiểm soát toàn bộ module của bot 🤖", // Thêm icon
    commandCategory: "Admin",
    usages: "[mdl/un/All/unAll/info/count] [tên module]",
    cooldowns: 1,
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

const loadCommand = function ({ moduleList, threadID, messageID, api }) { // Thêm api vào đây

    const { execSync } = require('child_process');
    const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule['fs-extra'];
    const { join } = global.nodemodule['path'];
    const { configPath, mainPath, api: clientApi } = global.client; // Đổi tên biến api trong global.client để tránh trùng lặp
    const logger = require(mainPath + '/utils/log');

    var errorList = [];
    delete require['resolve'][require['resolve'](configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + '.temp', JSON.stringify(configValue, null, 2), 'utf8');
    for (const nameModule of moduleList) {
        try {
            const dirModule = __dirname + '/' + nameModule + '.js';
            delete require['cache'][require['resolve'](dirModule)];
            const command = require(dirModule);
            global.client.commands.delete(nameModule);
            if (!command.config || !command.run || !command.config.commandCategory)
                throw new Error('Module không đúng định dạng! 🚫'); // Thêm icon

            // Chuyển toàn bộ tên module sang chữ thường và không có ký tự đặc biệt nếu có
            // Điều này đảm bảo tính nhất quán và loại bỏ "chữ ngoại font mặc định" như mày ghét
            command.config.name = command.config.name.toLowerCase().replace(/[^a-z0-9]/g, '');

            global.client['eventRegistered'] = global.client['eventRegistered']['filter'](info => info != command.config.name);
            if (command.config.dependencies && typeof command.config.dependencies == 'object') {
                const listPackage = JSON.parse(readFileSync('./package.json')).dependencies,
                    listbuiltinModules = require('module')['builtinModules'];
                for (const packageName in command.config.dependencies) {
                    var tryLoadCount = 0,
                        loadSuccess = false, // !![] đổi thành false
                        error;
                    const moduleDir = join(global.client.mainPath, 'nodemodules', 'node_modules', packageName);
                    try {
                        if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                        else global.nodemodule[packageName] = require(moduleDir);
                    } catch (err) { // Thêm err để bắt lỗi cụ thể hơn
                        logger.loader('Không tìm thấy package ' + packageName + ' hỗ trợ cho lệnh ' + command.config.name + ' tiến hành cài đặt... 📦', 'warn'); // Thêm icon
                        const insPack = {};
                        insPack.stdio = 'inherit';
                        insPack.env = process.env;
                        insPack.shell = true; // !![] đổi thành true
                        insPack.cwd = join(global.client.mainPath, 'nodemodules')
                        execSync('npm --package-lock false --save install ' + packageName + (command.config.dependencies[packageName] == '*' || command.config.dependencies[packageName] == '' ? '' : '@' + command.config.dependencies[packageName]), insPack);
                        for (tryLoadCount = 1; tryLoadCount <= 3; tryLoadCount++) {
                            require['cache'] = {};
                            try {
                                if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName)) global.nodemodule[packageName] = require(packageName);
                                else global.nodemodule[packageName] = require(moduleDir);
                                loadSuccess = true; // !![] đổi thành true
                                break;
                            } catch (erorr) {
                                error = erorr;
                            }
                            if (loadSuccess || !error) break;
                        }
                        if (!loadSuccess || error) throw 'không thể tải package ' + packageName + (' cho lệnh ') + command.config.name + ', lỗi: ' + error + ' ' + error['stack'];
                    }
                }
                logger.loader('Đã tải thành công toàn bộ package cho lệnh ' + command.config.name + ' ✨'); // Thêm icon
            }
            if (command.config.envConfig && typeof command.config.envConfig == 'object') { // 'Object' đổi thành 'object'
                try {
                    for (const [key, value] of Object['entries'](command.config.envConfig)) {
                        if (typeof global.configModule[command.config.name] == 'undefined') // undefined trong ngoặc nháy
                            global.configModule[command.config.name] = {};
                        if (typeof configValue[command.config.name] == 'undefined') // undefined trong ngoặc nháy
                            configValue[command.config.name] = {};
                        if (typeof configValue[command.config.name][key] !== 'undefined') // undefined trong ngoặc nháy
                            global.configModule[command.config.name][key] = configValue[command.config.name][key];
                        else global.configModule[command.config.name][key] = value || '';
                        if (typeof configValue[command.config.name][key] == 'undefined') // undefined trong ngoặc nháy
                            configValue[command.config.name][key] = value || '';
                    }
                    logger.loader('loaded config ' + command.config.name + ' ⚙️'); // Thêm icon
                } catch (error) {
                    throw new Error('» Không thể tải config module, lỗi: ' + JSON.stringify(error) + ' ❌'); // Thêm icon
                }
            }
            if (command['onLoad']) try {
                const onLoads = {};
                onLoads['configValue'] = configValue;
                command['onLoad'](onLoads);
            } catch (error) {
                throw new Error('➜ Không thể onLoad module, lỗi: ' + JSON.stringify(error) + ' ⚠️'); // Thêm icon
            }
            if (command.handleEvent) global.client.eventRegistered.push(command.config.name);
            (global.config.commandDisabled.includes(nameModule + '.js') || configValue.commandDisabled.includes(nameModule + '.js'))
            && (configValue.commandDisabled.splice(configValue.commandDisabled.indexOf(nameModule + '.js'), 1),
            global.config.commandDisabled.splice(global.config.commandDisabled.indexOf(nameModule + '.js'), 1))
            global.client.commands.set(command.config.name, command)
            logger.loader('loaded command ' + command.config.name + ' 🎉'); // Thêm icon
        } catch (error) {
            errorList.push('- ' + nameModule + ' lý do: ' + error + ' tại ' + error['stack'] + ' 🐛'); // Thêm icon
        };
    }

    if (errorList.length != 0) {
        api.sendMessage(`⚠️ Những lệnh đã xảy ra sự cố khi đang load: \n${errorList.join('\n')}`, threadID, messageID); // Thay console.log bằng api.sendMessage, thêm icon
        api.setMessageReaction("😠", messageID);
    } else {
        api.sendMessage(`✅ Đã load thành công tất cả module!`, threadID, messageID); // Thêm icon
        api.setMessageReaction("👍", messageID);
        writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8')
        unlinkSync(configPath + '.temp');
        return;
    }
}


const unloadModule = function ({ moduleList, threadID, messageID, api }) { // Thêm api vào đây
    const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { configPath, mainPath } = global.client; // Xóa api trong global.client để tránh trùng lặp
    const logger = require(mainPath + "/utils/log").loader;

    delete require.cache[require.resolve(configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), 'utf8');

    for (const nameModule of moduleList) {
        global.client.commands.delete(nameModule);
        global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);
        configValue["commandDisabled"].push(`${nameModule}.js`);
        global.config["commandDisabled"].push(`${nameModule}.js`);
        logger(`đã unload lệnh ${nameModule}! 😴`); // Thêm icon
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4), 'utf8');
    unlinkSync(configPath + ".temp");

    return api.sendMessage(`✔️ Đã hủy thành công ${moduleList.length} lệnh.`, threadID, messageID); // Thêm icon
}


module.exports.run = function ({ event, args, api }) { // api cần được truyền vào
    const { readdirSync } = global.nodemodule["fs-extra"];
    const { threadID, messageID } = event;
    var moduleList = args.splice(1, args.length);
    switch (args[0]) {
      case "count": {
        let commands = global.client.commands.values(); // Đã thêm global
        let infoCommand = "";
        api.sendMessage("📈 Hiện tại đang có " + global.client.commands.size + " lệnh có thể sử dụng!"+ infoCommand, event.threadID, event.messageID); // Thêm icon, thêm global
        break;
      }
        case "mdl": {
            if (moduleList.length == 0) return api.sendMessage("🚫 Tên module không được để trống! ", threadID, messageID); // Thêm icon
            else return loadCommand({ moduleList, threadID, messageID, api }); // Truyền api vào
        }
        case "un": {
            if (moduleList.length == 0) return api.sendMessage("🚫 Tên module không được để trống! ", threadID, messageID); // Thêm icon
            else return unloadModule({ moduleList, threadID, messageID, api }); // Truyền api vào
        }
        case "all": { // Chuyển "All" thành "all" cho đồng bộ
            moduleList = readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes('example'));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return loadCommand({ moduleList, threadID, messageID, api }); // Truyền api vào
        }
        case "unall": { // Chuyển "unAll" thành "unall" cho đồng bộ
            moduleList = readdirSync(__dirname).filter((file) => file.endsWith(".js") && !file.includes('example') && !file.includes("command"));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return unloadModule({ moduleList, threadID, messageID, api }); // Truyền api vào
        }
        case "info": {
            const command = global.client.commands.get(moduleList.join("") || ""); // Đã thêm global

            if (!command) return api.sendMessage("❓ Module bạn nhập không tồn tại!", threadID, messageID); // Thêm icon

            const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;

            return api.sendMessage(
                "=== ℹ️ " + name.toUpperCase() + " ℹ️ ===\n" + // Thêm icon
                "- được code bởi: " + credits + "\n" +
                "- phiên bản: " + version + "\n" +
                "- yêu cầu quyền hạn: " + ((hasPermssion == 0) ? "người dùng" : (hasPermssion == 1) ? "quản trị viên" : "người vận hành bot" ) + "\n" +
                "- thời gian chờ: " + cooldowns + " giây(s)\n" +
                `- các package yêu cầu: ${(Object.keys(dependencies || {})).join(", ") || "không có"}`,
                threadID, messageID
            );
        }
        default: {
            return global.utils.throwError(this.config.name, threadID, messageID);
        }
    }
}