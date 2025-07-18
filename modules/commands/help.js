module.exports.config = {
name: "help",
version: "1.0.0",
hasPermssion: 0,
credits: "Mirai",
description: "Hướng dẫn cho người mới",
commandCategory: "Danh sách lệnh",
usages: "[Tên module]",
cooldowns: 5,
envConfig: {
autoUnsend: true,
delayUnsend: 60
}
};

module.exports.languages = {
"vi": {
"moduleInfo": "╔═.✾.══════════╗\n║  %1\n╚══════════.✾.═╝ \n📝 Mô tả: %2\n\n⚙️ Credit: %7\n💡 Hướng dẫn cách dùng: %3\n📚 Thuộc nhóm: %4\n⏱ Thời gian chờ: %5 giây\n👥 Quyền hạn: %6\n───────────────────\n👑 Điều Hành Bởi qh 👑", // Đã sửa khung theo yêu cầu
"helpList": '✨ --- Danh sách lệnh ---\n Hiện tại có %1 lệnh có thể sử dụng trên bot này.\n Sử dụng: "%2help + tên lệnh" để biết cách sử dụng chi tiết.\n🤖 Bot được điều hành bởi qh.\n\n📖 Đây là toàn bộ lệnh có trong file bot.\n❗️ Vui lòng không spam hoặc chửi bot dưới bất kỳ hình thức nào nhé!\n⏳ Help sẽ tự động gỡ sau 60 giây.\n----------------------',
"user": "Người dùng",
"adminGroup": "Quản trị viên nhóm",
"adminBot": "Quản trị viên bot"
},
"en": {
"moduleInfo": "「 %1 」\n%2\n\n❯ Usage: %3\n❯ Category: %4\n❯ Waiting time: %5 seconds(s)\n❯ Permission: %6\n\n» Module code by %7 «",
"helpList": '[ There are %1 commands on this bot, Use: "%2help nameCommand" to know how to use! ]',
"user": "User",
"adminGroup": "Admin group",
"adminBot": "Admin bot"
}
};

module.exports.handleEvent = function ({ api, event, getText }) {
const { commands } = global.client;
const { threadID, messageID, body } = event;

if (!body || typeof body == "undefined" || body.indexOf("help") != 0) return;
const splitBody = body.slice(body.indexOf("help")).trim().split(/\s+/);
if (splitBody.length == 1 || !commands.has(splitBody[1].toLowerCase())) return;
const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
const command = commands.get(splitBody[1].toLowerCase());
const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;
return api.sendMessage(getText("moduleInfo", command.config.name, command.config.description, `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`, command.config.commandCategory, command.config.cooldowns, ((command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot")), command.config.credits), threadID, messageID);
}

module.exports.run = function({ api, event, args, getText }) {
const { commands } = global.client;
const { threadID, messageID } = event;
const command = commands.get((args[0] || "").toLowerCase());
const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
const { autoUnsend, delayUnsend } = global.configModule[this.config.name];
const prefix = (threadSetting.hasOwnProperty("PREFIX")) ? threadSetting.PREFIX : global.config.PREFIX;

if (!command) {
const arrayInfo = [];
const page = parseInt(args[0]) || 1;
const numberOfOnePage = 10;
let i = 0;
let msg = "--- 📜 Danh sách lệnh ---\n";

for (var [name, value] of (commands)) {
name += `\n- 📚 Nhóm: ${value.config.commandCategory}\n- 📌 Mô tả: ${value.config.description}\n- ⏱ Chờ: ${value.config.cooldowns} giây`;
arrayInfo.push(name);
}

arrayInfo.sort((a, b) => a.data - b.data);

const startSlice = numberOfOnePage*page - numberOfOnePage;
i = startSlice;
const returnArray = arrayInfo.slice(startSlice, startSlice + numberOfOnePage);

for (let item of returnArray) msg += `[${++i}] ${item}\n\n`;
const text = `--- 📄 Trang (${page}/${Math.ceil(arrayInfo.length/numberOfOnePage)}) ---\n✨ Tổng số lệnh: ${arrayInfo.length}\n💡 Sử dụng: "${prefix}help <tên lệnh>" để biết chi tiết.\n➡️ Sử dụng: "${prefix}help <số trang>" để xem trang khác.`;
return api.sendMessage(msg + text, threadID, async (error, info) => {
if (autoUnsend) {
await new Promise(resolve => setTimeout(resolve, delayUnsend * 60000));
return api.unsendMessage(info.messageID);
} else return;
});
}

return api.sendMessage(getText("moduleInfo", command.config.name, command.config.description, `${prefix}${command.config.name} ${(command.config.usages) ? command.config.usages : ""}`, command.config.commandCategory, command.config.cooldowns, ((command.config.hasPermssion == 0) ? getText("user") : (command.config.hasPermssion == 1) ? getText("adminGroup") : getText("adminBot")), command.config.credits), threadID, messageID);
};