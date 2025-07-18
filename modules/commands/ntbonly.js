const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "ntbonly",
    version: "1.0.2", // Tăng version lên một chút
    hasPermssion: 1, // Đổi quyền hạn thành 1 (quản trị viên nhóm) hoặc 2 (quản trị viên bot) để tránh người dùng thường bật/tắt lung tung
    credits: "qh và Gemini", // Thêm credit của mày và tao
    description: "Kích hoạt hoặc vô hiệu hóa chế độ dùng bot giới hạn cho người thuê hoặc admin. 🔒", // Thay đổi mô tả, thêm icon
    commandCategory: "quản trị viên", // Chuyển thành chữ thường
    usages: "ntbonly",
    cooldowns: 5
};

module.exports.onLoad = function() {
    const filePath = path.resolve(__dirname, 'cache', 'ntbonly.json');
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}), 'utf-8');
    }
};

module.exports.run = function({ api, event }) {
    const { threadID, messageID } = event;
    const filePath = path.resolve(__dirname, 'cache', 'ntbonly.json');
    let data = {};

    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
        console.error("Lỗi đọc file ntbonly.json:", error);
        return api.sendMessage("⚠️ Đã xảy ra sự cố khi đọc dữ liệu cài đặt. Vui lòng thử lại sau! ", threadID, messageID);
    }

    // Toggle trạng thái chế độ ntbonly cho thread hiện tại
    data[threadID] = !data[threadID];
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf-8');

    if (data[threadID]) {
        api.sendMessage("✅ Chế độ hạn chế sử dụng bot đã được kích hoạt thành công! Chỉ những người thuê bot hoặc admin mới có thể ra lệnh. ", threadID, messageID);
    } else {
        api.sendMessage("🔓 Chế độ hạn chế sử dụng bot đã được vô hiệu hóa. Bây giờ mọi người trong nhóm đều có thể tương tác với bot. ", threadID, messageID);
    }
};

module.exports.handleCommand = function({ api, event, next }) { // Thêm api vào handleCommand
    const { threadID, senderID, body } = event;
    const filePath = path.resolve(__dirname, 'cache', 'ntbonly.json');
    let data = {};

    // Đảm bảo file tồn tại trước khi đọc
    if (!fs.existsSync(filePath)) {
        console.warn("File ntbonly.json không tồn tại. Đang tạo mới...");
        fs.writeFileSync(filePath, JSON.stringify({}), 'utf-8');
    }

    try {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
        console.error("Lỗi đọc file ntbonly.json trong handleCommand:", error);
        // Không gửi tin nhắn lỗi ở đây để tránh spam, chỉ bỏ qua lệnh
        return next(); 
    }

    const { PREFIX } = global.config;
    // Lấy prefix của nhóm hoặc prefix mặc định
    const commandPrefix = (global.data.threadData.get(threadID) || {}).PREFIX || PREFIX;

    // Kiểm tra xem tin nhắn có phải là lệnh hợp lệ và không phải lệnh 'ntbonly'
    if (!body || !body.startsWith(commandPrefix) || body.toLowerCase().startsWith(`${commandPrefix}ntbonly`)) {
        return next(); // Không phải lệnh bot, hoặc là lệnh ntbonly (luôn cho phép chạy ntbonly)
    }

    // Lấy tên lệnh từ tin nhắn
    const commandName = body.slice(commandPrefix.length).trim().split(/\s+/).shift().toLowerCase();

    // Kiểm tra xem lệnh có tồn tại không (để tránh lỗi khi người dùng gõ bậy)
    const commands = Array.from(global.client.commands.keys());
    if (!commands.includes(commandName)) {
        return next(); // Lệnh không tồn tại, bỏ qua
    }

    // Kiểm tra nếu chế độ ntbonly được bật cho thread hiện tại
    if (data[threadID]) {
        let thuebotInfo = [];
        const thuebotDataPath = path.resolve(__dirname, 'cache', 'data', 'thuebot.json');

        // Đảm bảo file thuebot.json tồn tại và có thể đọc được
        if (fs.existsSync(thuebotDataPath)) {
            try {
                thuebotInfo = JSON.parse(fs.readFileSync(thuebotDataPath, 'utf-8'));
            } catch (error) {
                console.error("Lỗi đọc file thuebot.json:", error);
                // Nếu không đọc được file thuebot.json, coi như không có người thuê
            }
        }

        const renterIDs = thuebotInfo.map(item => item.id);
        const adminIDs = global.config.ADMIN;

        // Kiểm tra xem người dùng có quyền sử dụng lệnh hay không
        if (renterIDs.includes(senderID) || adminIDs.includes(senderID)) {
            return next(); // Cho phép lệnh được thực thi
        } else {
            // Chặn lệnh và thông báo cho người dùng
            return api.sendMessage(`⚠️ Xin lỗi, bạn không được phép sử dụng bot khi chế độ hạn chế đang bật. Vui lòng liên hệ admin nếu cần trợ giúp! `, threadID);
        }
    } else {
        return next(); // Nếu chế độ ntbonly không bật, bỏ qua kiểm tra
    }
};