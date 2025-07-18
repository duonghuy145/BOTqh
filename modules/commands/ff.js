const axios = require('axios');

module.exports.config = {
    name: "ff",
    version: "1.0.1", // Nâng version lên để đánh dấu thay đổi
    hasPermission: 0,
    credits: "qh và Gemini 👑", // Thêm credit của mày và tao
    description: "🔍 Xem thông tin chi tiết của tài khoản Free Fire qua ID. ✨",
    commandCategory: "Game", // Chuyển sang category Game cho hợp lý
    usages: "[ID Free Fire]", // Hướng dẫn sử dụng rõ ràng hơn
    cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
        return api.sendMessage("⚠️ Bạn quên nhập ID Free Fire rồi! Hãy cung cấp ID để tôi tra cứu nhé. 🔢", threadID, messageID);
    }

    const ffId = args[0];
    const apiUrl = `https://api.scaninfo.vn/freefire/info/?id=${ffId}&key=vay500k`; // Giữ nguyên API

    api.sendMessage(`🔄 Đang tìm kiếm thông tin tài khoản Free Fire ID: ${ffId}... Xin chờ giây lát nha! ⏳`, threadID, messageID);

    try {
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || Object.keys(data).length === 0) {
            return api.sendMessage(`❎ Không tìm thấy thông tin cho ID Free Fire: "${ffId}". Có vẻ ID này không tồn tại hoặc đã bị ẩn rồi. 🤔`, threadID, messageID);
        }

        let resultMessage = "🎮 『 THÔNG TIN FREE FIRE 』 🎮\n" +
                            "━━━━━━━━━━━━━━━━━━\n";

        // Hàm hỗ trợ format thông tin
        const formatInfo = (label, value) => {
            if (value === null || value === undefined || value === "") return "";
            return `  • ${label}: ${value}\n`;
        };

        // Thông tin người dùng
        resultMessage += "👤 **THÔNG TIN CƠ BẢN**\n";
        resultMessage += formatInfo("Tên", data["Account Name"]);
        resultMessage += formatInfo("ID", data["Account UID"]);
        resultMessage += formatInfo("Level", `${data["Account Level"]} (EXP: ${data["Account XP"]})`);
        resultMessage += formatInfo("Khu vực", data["Account Region"]);
        resultMessage += formatInfo("Lượt thích", data["Account Likes"]);
        // Xử lý giới tính/ngôn ngữ
        if (data["Account Language"] === 'Language_VIETNAMESE') {
            resultMessage += formatInfo("Ngôn ngữ", "Tiếng Việt");
        } else if (data["Account Language"]) {
            resultMessage += formatInfo("Ngôn ngữ", data["Account Language"].replace('Language_', '').replace('_', ' '));
        }
        resultMessage += formatInfo("Uy Tín", data["Account Honor Score"]);
        resultMessage += formatInfo("Chữ ký", data["Account Signature"]);
        resultMessage += "━━━━━━━━━━━━━━━━━━\n";

        // Thông tin hoạt động
        resultMessage += "📊 **HOẠT ĐỘNG**\n";
        resultMessage += formatInfo("Thẻ BP", data["Account Booyah Pass"]);
        resultMessage += formatInfo("Huy hiệu BP", data["Account Booyah Pass Badges"]);
        resultMessage += formatInfo("Ngày tạo tài khoản", data["Account Create Time (GMT 0530)"]);
        resultMessage += formatInfo("Lần đăng nhập cuối", data["Account Last Login (GMT 0530)"]);
        resultMessage += "━━━━━━━━━━━━━━━━━━\n";

        // Thông tin Pet (nếu có)
        if (data["Equipped Pet Information"]) {
            const petInfo = data["Equipped Pet Information"];
            resultMessage += "🐾 **THÔNG TIN PET ĐANG TRANG BỊ**\n";
            resultMessage += formatInfo("Tên Pet", petInfo["Pet Name"]);
            resultMessage += formatInfo("Loại Pet", petInfo["Pet Type"]);
            resultMessage += formatInfo("Level Pet", petInfo["Pet Level"]);
            resultMessage += formatInfo("EXP Pet", petInfo["Pet XP"]);
            resultMessage += "━━━━━━━━━━━━━━━━━━\n";
        }

        // Thông tin Quân Đoàn (nếu có)
        if (data["Guild Information"]) {
            const guildInfo = data["Guild Information"];
            const leaderInfo = data["Guild Leader Information"];
            resultMessage += "🛡️ **QUÂN ĐOÀN**\n";
            resultMessage += formatInfo("Tên Quân Đoàn", guildInfo["Guild Name"]);
            resultMessage += formatInfo("ID Quân Đoàn", guildInfo["Guild ID"]);
            resultMessage += formatInfo("Level Quân Đoàn", guildInfo["Guild Level"]);
            resultMessage += formatInfo("Thành viên", `${guildInfo["Guild Current Members"]}/${guildInfo["Guild Capacity"]}`);
            resultMessage += "  • **Chủ Quân Đoàn:**\n";
            resultMessage += formatInfo("    Tên", leaderInfo["Leader Name"]);
            resultMessage += formatInfo("    ID", leaderInfo["Leader UID"]);
            resultMessage += formatInfo("    Level", `${leaderInfo["Leader Level"]} (EXP: ${leaderInfo["Leader XP"]})`);
            resultMessage += formatInfo("    Tạo TK", leaderInfo["Leader Ac Created Time (GMT 0530)"]);
            resultMessage += formatInfo("    Đăng nhập cuối", leaderInfo["Leader Last Login Time (GMT 0530)"]);
            resultMessage += "━━━━━━━━━━━━━━━━━━\n";
        }

        resultMessage += "✨ Chúc bạn có những trận Free Fire thật bùng nổ! ✨";

        api.sendMessage(resultMessage, threadID, messageID);

    } catch (error) {
        console.error("❌ Lỗi khi lấy thông tin tài khoản Free Fire:", error);
        if (error.response && error.response.status === 404) {
            api.sendMessage(`Xin lỗi qh, không tìm thấy thông tin cho ID Free Fire: "${ffId}". Có vẻ ID này không hợp lệ hoặc đã bị khóa rồi. 🙁`, threadID, messageID);
        } else {
            api.sendMessage(`Oops! 🤯 Đã xảy ra lỗi khi kết nối với máy chủ Free Fire. Vui lòng thử lại sau nhé! ${error.message ? `(${error.message})` : ''}`, threadID, messageID);
        }
    }
};