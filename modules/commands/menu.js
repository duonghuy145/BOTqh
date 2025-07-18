const fs = require('fs');
const path = require('path');

module.exports.config = {
    name: 'menu', // ĐÃ SỬA LẠI TÊN LỆNH GỌI THÀNH 'menu'
    version: '1.1.8', // Tăng version lên
    hasPermssion: 0,
    credits: 'Chỉnh sửa bởi Gemini',
    description: 'Xem danh sách các nhóm lệnh và thông tin chi tiết lệnh',
    commandCategory: 'Tiện ích',
    usages: '[tên_lệnh | tất_cả]',
    cooldowns: 5,
    envConfig: {
        autoUnsend: { status: true, timeOut: 90 },
        adminFb: 'https://www.facebook.com/qhdz05' // ĐÃ CẬP NHẬT LINK FACEBOOK ADMIN CỦA MÀY
    }
};

const { autoUnsend = this.config.envConfig.autoUnsend, adminFb = this.config.envConfig.adminFb } = global.config?.menu || {};
const { findBestMatch } = require('string-similarity');

// Bảng ánh xạ icon cho từng loại lệnh
const categoryIcons = {
    "Thành Viên": "👤",
    "Tiện ích": "⚙️",
    "Quản Trị Viên": "🛡️",
    "Trò Chơi": "🎮",
    "Tìm kiếm": "🔍",
    "Kiếm Tiền": "💰",
    "Tình Yêu": "❤️",
    "Ảnh": "🖼️",
    "War": "⚔️",
    "Video": "🎬",
    "Danh sách lệnh": "📜",
    "Coin": "🪙",
    "Nhóm": "🏘️",
    "Media": "🎵",
    "Admin": "👑",
    "default": "🏷️" // Icon mặc định
};

// Hàm lấy icon theo loại lệnh
const getCategoryIcon = (category) => categoryIcons[category] || categoryIcons["default"];
// Hàm kiểm tra xem người dùng có phải Admin không
const isAdminUser = (senderID) => global.config.ADMINBOT.includes(senderID);

// Hàm lọc bỏ lệnh Admin nếu người dùng không phải Admin
function filterAdminCommands(commands, senderID) {
    if (isAdminUser(senderID)) return commands;
    return commands.filter(cmd => cmd.config.commandCategory !== 'Admin');
}

module.exports.run = async function ({ api, event, args }) {
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const cmds = filterAdminCommands(Array.from(global.client.commands.values()), sid);

    if (args.length >= 1) {
        const cmdName = args.join(' ');
        const targetCmd = cmds.find(cmd => cmd.config.name === cmdName);

        if (targetCmd) {
            // Nếu tìm thấy lệnh cụ thể, hiển thị thông tin chi tiết
            return send({ body: infoCmds(targetCmd.config) }, tid, mid);
        } else if (args[0] === 'tất_cả') {
            // Nếu yêu cầu xem tất cả lệnh
            let txt = '╭━━━『 📋 Toàn Bộ Lệnh 』━━╮\n';
            let count = 0;
            for (const cmd of cmds) txt += `┃ ${++count}. ${cmd.config.name} | ${cmd.config.description}\n`;
            txt += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\nTổng cộng: ${cmds.length} lệnh.\n` +
                   `Tin nhắn sẽ tự gỡ sau: ${autoUnsend.timeOut} giây\nLiên hệ Admin tại: ${adminFb}\n`;
            send({ body: txt }, tid, (a, b) => autoUnsend.status && setTimeout(() => un(b.messageID), 1000 * autoUnsend.timeOut));
        } else {
            // Nếu không tìm thấy lệnh, gợi ý lệnh gần giống
            const arrayCmds = cmds.map(cmd => cmd.config.name);
            const similarly = findBestMatch(cmdName, arrayCmds);
            if (similarly.bestMatch.rating >= 0.3) return send(`Lệnh "${cmdName}" này giống "${similarly.bestMatch.target}" đó mày.`, tid, mid);
            else return send(`Không tìm thấy lệnh nào tên "${cmdName}" đâu mày!`, tid, mid);
        }
    } else {
        // Hiển thị menu chính (danh sách nhóm lệnh)
        const data = commandsGroup(cmds);
        let txt = '╭━━━『 📜  Bảng Lệnh  』━━╮\n';
        let count = 0;
        for (const { commandCategory, commandsName } of data) {
            if (commandCategory === 'Admin' && !isAdminUser(sid)) continue;
            txt += `┃ ${++count}. ${getCategoryIcon(commandCategory)} ${commandCategory}: ${commandsName.length} lệnh\n`;
        }
        txt += `╰━━━━━━━━━━━━━╯\n╭━━━━━━━╮\n┃  Tổng cộng: ${cmds.length} lệnh.\n╰━━━━━━━╯ ` +
               `Phản hồi bằng số (từ 1 đến ${count}) để xem chi tiết nhóm lệnh.\n` +
               `Gõ "${global.config.PREFIX}menu all" để xem toàn bộ lệnh có thể dùng.\n` +
               `Tin nhắn sẽ tự gỡ sau: ${autoUnsend.timeOut} giây`;

        send({ body: txt }, tid, (a, b) => {
            global.client.handleReply.push({ name: this.config.name, messageID: b.messageID, author: sid, 'case': 'infoGr', data });
            if (autoUnsend.status) setTimeout(() => un(b.messageID), 1000 * autoUnsend.timeOut);
        });
    }
};

module.exports.handleReply = async function ({ handleReply: $, api, event }) {
    const { sendMessage: send, unsendMessage: un } = api;
    const { threadID: tid, messageID: mid, senderID: sid, args } = event;
    const cmds = filterAdminCommands(Array.from(global.client.commands.values()), sid);

    if (sid != $.author) {
        return send("Bạn chưa biết xài thì coi lại menu đi, muốn dùng lệnh nào thì gõ đúng lệnh đó ra nhé!", tid, mid);
    }

    switch ($.case) {
        case 'infoGr': {
            const replyIndex = (+args[0]) - 1;
            const dataFiltered = $.data.filter(item => item.commandCategory !== 'Admin' || isAdminUser(sid));
            const data = dataFiltered[replyIndex];

            if (!data) return send(`Số "${args[0]}" này không có trong danh sách nhóm lệnh.`, tid, mid);

            un($.messageID);
            let txt = `╭━━━『 ${getCategoryIcon(data.commandCategory)} ${data.commandCategory} 』━━╮\n`;
            let count = 0;
            for (const name of data.commandsName) txt += `┃ ${++count}. ${name}\n`;
            txt += `╰━━━━━━━━━━━━━━━━━━━━━╯\n\nPhản hồi bằng số (từ 1 đến ${data.commandsName.length}) để xem chi tiết lệnh.\n` +
                   `Tin nhắn sẽ tự gỡ sau: ${autoUnsend.timeOut} giây`;

            send({ body: txt }, tid, (a, b) => {
                global.client.handleReply.push({ name: this.config.name, messageID: b.messageID, author: sid, 'case': 'infoCmds', data: data.commandsName });
                if (autoUnsend.status) setTimeout(() => un(b.messageID), 1000 * autoUnsend.timeOut);
            });
            break;
        }
        case 'infoCmds': {
            const replyIndex = (+args[0]) - 1;
            const cmdName = $.data[replyIndex];
            const data = cmds.find(cmd => cmd.config.name === cmdName);

            if (!data) return send(`Số "${args[0]}" này không có trong danh sách chi tiết lệnh.`, tid, mid);

            un($.messageID);
            send({ body: infoCmds(data.config) }, tid, mid);
            break;
        }
    }
};

// Hàm nhóm các lệnh theo loại
function commandsGroup(cmds) {
    const array = [];
    for (const cmd of cmds) {
        const { name, commandCategory } = cmd.config;
        const find = array.find(i => i.commandCategory === commandCategory);
        !find ? array.push({ commandCategory, commandsName: [name] }) : find.commandsName.push(name);
    }
    // Sắp xếp nhóm Admin xuống cuối, và các nhóm khác theo số lượng lệnh giảm dần
    array.sort((a, b) => {
        if (a.commandCategory === 'Admin') return 1;
        if (b.commandCategory === 'Admin') return -1;
        return b.commandsName.length - a.commandsName.length;
    });
    return array;
}

// Hàm format thông tin chi tiết của một lệnh
function infoCmds(a) {
    return `╭── ℹ️ THÔNG TIN ────⭓\n` +
           `│ 📔 Tên lệnh: ${a.name}\n` +
           `│ 🌴 Phiên bản: ${a.version}\n` +
           `│ 🔐 Quyền hạn: ${premssionTxt(a.hasPermssion)}\n` +
           `│ 👤 Tác giả: ${a.credits}\n` +
           `│ 🌾 Mô tả: ${a.description}\n` +
           `│ 📎 Thuộc loại: ${a.commandCategory}\n` +
           `│ 📝 Cách dùng: ${a.usages}\n` +
           `│ ⏳ Thời gian chờ: ${a.cooldowns} giây\n` +
           `╰─────────────⭓`;
}

// Hàm chuyển số quyền hạn thành chữ
function premssionTxt(a) {
    return a === 0 ? 'Thành Viên' : a === 1 ? 'Quản Trị Viên' : a === 2 ? 'Admin' : 'ADMINBOT';
}