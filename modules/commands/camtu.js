const p = "😠"; // Biểu tượng cho hành động xóa thành viên
const a = "👍"; // Biểu tượng cho hành động hủy bỏ
const {
    resolve: b
} = require("path");
const {
    existsSync: q,
    writeFileSync: j
} = require("fs-extra");
const e = b(__dirname, 'cache/data/camtu.json');
module.exports.config = {
    name: "camtu",
    version: "1.0.0",
    credits: "NTKhang (fix by DEV NDK) - modded by qh and Gemini 💎", // Đã thêm credit của Xám và qh
    hasPermssion: 1,
    description: "Cảnh báo thành viên vi phạm từ ngữ 🚨",
    usages: "camtu on/off add/del list",
    commandCategory: "Quản Trị Viên 🛡️",
    cooldowns: 0
};
module.exports.run = async ({
    api: f,
    event: a,
    args: b
}) => {
    if (!q(e)) {
        try {
            j(e, JSON.stringify({}, null, "\t"));
        } catch (b) {
            console.error("Lỗi khi tạo file camtu.json:", b); // Sửa lỗi console.log không rõ ràng
        }
    }
    const c = require("cache/data/camtu.json");
    // const d = await f.getThreadInfo(a.threadID); // Biến 'd' không được sử dụng sau khi khai báo, có thể xóa
    if (!c.hasOwnProperty(a.threadID)) {
        c[a.threadID] = {
            data: {}
        };
        j(e, JSON.stringify(c, null, "\t"));
    }
    const g = c[a.threadID].data || {};
    if (!g.camtu) {
        g.camtu = {
            words: [],
            enables: false
        };
        j(e, JSON.stringify(c, null, "\t"));
    }
    if (b[0] == "on") {
        g.camtu.enables = true;
        j(e, JSON.stringify(c, null, "\t"));
        return f.sendMessage("💥 Auto cấm từ đã được kích hoạt! Tin nhắn vi phạm sẽ không thoát được mắt thần của bot đâu nhé! 😎", a.threadID, a.messageID); // Tin nhắn thông báo mới
    } else if (b[0] == "off") {
        g.camtu.enables = false;
        j(e, JSON.stringify(c, null, "\t"));
        return f.sendMessage("😴 Auto cấm từ đã tạm ngưng hoạt động. Nhóm bạn có thể thoải mái hơn, nhưng nhớ giữ chừng mực nha! 😉", a.threadID, a.messageID); // Tin nhắn thông báo mới
    } else if (b[0] == "add") {
        if (!b[1]) {
            return f.sendMessage("📝 Bạn muốn thêm từ gì vào danh sách đen? Nhập ngay nào! ✍️", a.threadID, a.messageID); // Tin nhắn thông báo mới
        }
        const i = b.slice(1).join(" ");
        let d = i.split(",").map(b => b.trim());
        d = d.filter(b => !g.camtu.words.includes(b));
        g.camtu.words.push(...d);
        j(e, JSON.stringify(c, null, "\t"));
        return f.sendMessage(`🎉 Đã thêm thành công ${d.length} từ mới vào danh sách cấm! Cẩn thận lời ăn tiếng nói nhé các mem! 🤐`, a.threadID, a.messageID); // Tin nhắn thông báo mới
    } else if (b[0] == "del") {
        const i = b.slice(1).join(" ");
        let d = i.split(",").map(b => b.trim());
        d = d.filter(b => g.camtu.words.includes(b));
        for (const b of d) {
            g.camtu.words.splice(g.camtu.words.indexOf(b), 1);
        }
        j(e, JSON.stringify(c, null, "\t"));
        return f.sendMessage(`🗑️ Đã gỡ bỏ ${d.length} từ khỏi danh sách cấm! Nhóm lại thoáng đãng hơn chút rồi! ✨`, a.threadID, a.messageID); // Tin nhắn thông báo mới
    } else if (b[0] == "list") {
        let b = "📋 Danh sách những từ bị 'cấm cửa' trong nhóm: \n\n"; // Tin nhắn thông báo mới
        if (g.camtu.words.length === 0) {
            b += "Chưa có từ nào trong danh sách cấm đâu nha! Ngôn từ trong sáng quá! 😇"; // Tin nhắn khi không có từ cấm
        } else {
            g.camtu.words.forEach((c, index) => b += ` ${index + 1}. ${c}\n`); // Thêm số thứ tự
        }
        return f.sendMessage(b, a.threadID, a.messageID);
    } else {
        return f.sendMessage(`━━━━━ [ Auto Cấm Từ 🚫 ] ━━━━━\n\n👉 ${global.config.PREFIX}camtu add [từ cần cấm] ➕\n👉 ${global.config.PREFIX}camtu del [từ đã cấm] ➖\n(Thêm/xóa nhiều từ cùng lúc bằng cách dùng dấu "," để phân cách)\n👉 ${global.config.PREFIX}camtu list 📝: Xem danh sách từ cấm\n👉 ${global.config.PREFIX}camtu on 🟢: Kích hoạt Auto cấm từ\n👉 ${global.config.PREFIX}camtu off 🔴: Vô hiệu hóa Auto cấm từ`, a.threadID, a.messageID); // Tin nhắn hướng dẫn mới
    }
};
module.exports.handleEvent = async ({
    api: b,
    event: c,
    Threads: d
}) => {
    const {
        senderID: f,
        threadID: g
    } = c;
    const h = global.data.threadInfo.get(g) || (await d.getInfo(g));
    const i = (h.adminIDs || []).find(b => b.id == f);
    const k = [b.getCurrentUserID(), ...global.config.ADMINBOT, ...global.config.NDH];
    const l = i || k.some(b => b == f);
    if (!q(e)) {
        try {
            j(e, JSON.stringify({}, null, "\t"));
        } catch (b) {
            console.error("Lỗi khi tạo file camtu.json:", b); // Sửa lỗi console.log không rõ ràng
        }
    }
    const m = require("cache/data/camtu.json");
    if (!m.hasOwnProperty(c.threadID)) {
        m[c.threadID] = {
            data: {}
        };
        j(e, JSON.stringify(m, null, "\t"));
    }
    if (c.body && !l) {
        try {
            const f = m[c.threadID].data || {};
            if (!f.camtu) {
                return;
            }
            if (f.camtu.enables) {
                const d = c.body.toLowerCase().match(new RegExp("(\\s|^)(" + f.camtu.words.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "+").join("|") + ")(\\s|$)", "gi")); // Đã thêm escape ký tự đặc biệt trong RegExp
                if (d) {
                    return b.sendMessage(`🚨 Cảnh báo! Từ cấm '${d[0].trim()}' đã xuất hiện! 😱 Quản trị viên ơi, hãy thả cảm xúc ${p} (giận dữ) để 'tiễn' thành viên này hoặc ${a} (thích) để bỏ qua nha! 🙏`, c.threadID, async (d, a) => { // Tin nhắn thông báo mới
                        global.client.handleReaction.push({
                            name: this.config.name,
                            messageID: a.messageID,
                            targetID: c.senderID
                        });
                    }, c.messageID);
                }
            }
        } catch (b) {
            console.error("Lỗi trong handleEvent:", b); // Sửa lỗi console.log không rõ ràng
        }
    }
};
module.exports.handleReaction = async ({
    api: q,
    event: c,
    Threads: b,
    handleReaction: d,
    Users: e
}) => {
    const {
        targetID: f,
        messageID: g
    } = d;
    const {
        userID: h,
        threadID: i
    } = c;
    const j = global.data.threadInfo.get(i) || (await b.getInfo(i));
    const k = j.adminIDs.some(b => b.id == h);
    const l = [q.getCurrentUserID(), ...global.config.ADMINBOT, ...global.config.NDH];
    const m = k || l.some(b => b == h);
    if (!m) {
        return;
    }
    if (c.reaction == p) {
        // const b = await q.getThreadInfo(c.threadID); // Biến 'b' không được sử dụng sau khi khai báo, có thể xóa
        return q.removeUserFromGroup(f, c.threadID, async b => {
            if (b) {
                q.sendMessage("🚫 Ui chà! Bot không thể xóa thành viên này. 🙁 Hãy thử cấp quyền Quản trị viên cho bot rồi thả cảm xúc lại tin nhắn trên nhé! 💪", c.threadID, c.messageID); // Tin nhắn thông báo mới
            } else {
                q.unsendMessage(g);
                const d = await e.getNameUser(h);
                const a = await e.getNameUser(f);
                q.sendMessage(`✅ Quản trị viên ${d} đã "tiễn" thành viên ${a} ra khỏi nhóm vì vi phạm nội quy! Giữ gìn nhóm trong sạch nha! 🧹`, c.threadID); // Tin nhắn thông báo mới
            }
        });
    } else if (c.reaction == a) {
        return q.unsendMessage(g);
    }
};