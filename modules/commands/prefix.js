const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
    name: "prefix",
    version: "2.0.4", // Tăng version
    hasPermission: 0,
    credits: "DongDev (mod by qh và Gemini)",
    description: "Xem prefix của bot.", // Mô tả ngắn gọn hơn
    commandCategory: "Thông tin",
    usages: "",
    cooldowns: 5
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, body, messageID } = event;
    const { PREFIX } = global.config; // Lấy prefix hệ thống từ global.config
    const gio = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss || DD/MM/YYYY");

    // Lấy prefix của nhóm (nếu có cài đặt riêng)
    let threadSetting = global.data.threadData.get(threadID) || {};
    let currentPrefix = threadSetting.PREFIX || PREFIX; // Dùng currentPrefix để tránh nhầm lẫn

    const textBody = body ? body.toLowerCase() : ""; // Đảm bảo body tồn tại trước khi dùng toLowerCase

    if (
        textBody === "prefix" ||
        textBody === "dùng bot kiểu gì" ||
        textBody === "dùng bot như nào" ||
        textBody === "dùng sao"
    ) {
        const message = 
            `✨ ==== [ PREFIX BOT ] ==== ✨\n` +
            `──────────────────\n` +
            `👉 Prefix của nhóm: ${currentPrefix}\n` +
            `🌐 Prefix hệ thống: ${PREFIX}\n` +
            `──────────────────\n` +
            `⏰ Time: ${gio}`;

        api.sendMessage(message, threadID, messageID);
    }
};

module.exports.run = async function () {
    // Hàm run này không cần làm gì vì logic chính nằm ở handleEvent
};