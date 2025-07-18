const fs = require('fs-extra');
const path = require('path');
const pathData = path.join(__dirname, '../commands/cache/antibd.json');

module.exports.config = {
    name: "antibd",
    eventType: ["log:user-nickname"],
    version: "1.0.2", // Nâng cấp version nhẹ
    credits: "qh & Gemini 💖", // Đã bổ sung credits cho Gemini và qh
    description: "Ngăn chặn việc đổi biệt danh nhóm và khôi phục biệt danh cũ. 🚫", // Thêm icon và mô tả rõ hơn
};

module.exports.run = async function ({ event, api, Threads }) {
    const { threadID, logMessageData } = event;
    const botID = api.getCurrentUserID();

    try {
        let antiData;
        try {
            antiData = await fs.readJSON(pathData);
            // Đảm bảo antiData là một mảng, nếu không thì khởi tạo lại
            if (!Array.isArray(antiData)) {
                console.warn("⚠️ [ANTIBD] File antibd.json không phải là mảng. Đã khởi tạo lại.");
                antiData = [];
                await fs.writeJSON(pathData, antiData); // Ghi lại file rỗng nếu cần
            }
        } catch (error) {
            // Nếu file không tồn tại hoặc lỗi, khởi tạo antiData là mảng rỗng
            console.error("❌ [ANTIBD] Lỗi khi đọc file antibd.json, khởi tạo rỗng:", error);
            antiData = [];
            await fs.writeJSON(pathData, antiData); // Tạo file rỗng
        }

        const threadEntry = antiData.find(entry => entry.threadID === threadID);

        if (!threadEntry) {
            return; // Nếu không có dữ liệu cho thread này, không làm gì cả
        }

        const originalNicknames = threadEntry.data;
        const changedUserID = logMessageData.participant_id;
        const oldNickname = originalNicknames[changedUserID];
        const newNickname = logMessageData.nickname;

        if (changedUserID === botID) {
            return; // Bot tự đổi biệt danh thì bỏ qua
        }

        // Chỉ xử lý nếu biệt danh mới khác biệt danh cũ
        if (newNickname !== oldNickname) {
            api.changeNickname(oldNickname || "", threadID, changedUserID, (err) => {
                if (err) {
                    api.sendMessage("⚠️ Ôi không! Đã xảy ra lỗi khi khôi phục biệt danh cho thành viên. 😥", threadID);
                    console.error(`Lỗi khi đổi biệt danh cho ${changedUserID} trong ${threadID}:`, err);
                } else {
                    api.sendMessage(`✅ Lệnh Anti-BD đang hoạt động! Biệt danh của ${logMessageData.participant_id} đã được khôi phục về **${oldNickname || "biệt danh mặc định"}** rồi nhé! 🛡️`, threadID);
                }
            });
        }
    } catch (error) {
        console.error("💥 Lỗi tổng quát khi xử lý sự kiện đổi biệt danh (antibd.js):", error);
    }
};