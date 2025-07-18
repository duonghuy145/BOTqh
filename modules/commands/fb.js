const axios = require('axios');
const moment = require('moment'); // Đảm bảo đã cài moment-timezone nếu cần múi giờ cụ thể, nếu không thì moment là đủ.

module.exports.config = {
    name: "fb",
    version: "1.0.1", // Tăng version sau khi mod
    hasPermission: 0,
    credits: "SumiProject - modded by qh and Gemini ✨", // Cập nhật credit
    description: "Lấy thông tin chi tiết tài khoản Facebook qua UID 🕵️‍♀️",
    commandCategory: "Thông Tin ℹ️",
    usages: "fb [uid]",
    cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
    if (!args[0]) {
        return api.sendMessage(
            "❗ Bạn quên nhập UID rồi! Để xem thông tin Facebook, hãy cung cấp UID nhé. Ví dụ: `fb [UID]`\nBạn có thể dùng lệnh `uid` để lấy UID của bản thân hoặc người khác.",
            event.threadID,
            event.messageID
        );
    }

    const targetId = args[0];
    // Sử dụng API key mặc định từ SumiProject. Lưu ý rằng API này có thể thay đổi hoặc bị giới hạn.
    const apiUrl = `https://api.sumiproject.net/facebook/getinfov2?uid=${targetId}&apikey=apikeysumi`;

    try {
        api.sendMessage("⏳ Đang tra cứu thông tin Facebook... Chờ Gemini chút nhé! ✨", event.threadID, event.messageID);

        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data || Object.keys(data).length === 0) { // Kiểm tra dữ liệu rỗng hoặc không hợp lệ
            return api.sendMessage("❌ Không tìm thấy thông tin cho UID này hoặc dữ liệu không hợp lệ. Vui lòng kiểm tra lại UID hoặc thử lại sau.", event.threadID, event.messageID);
        }

        const formattedFollowers = (data.subscribers?.summary?.total_count || 0).toLocaleString('en-US');

        let gender = data.gender ? data.gender : "Không xác định ❔";
        if (gender === "male") {
            gender = "Nam ♂️";
        } else if (gender === "female") {
            gender = "Nữ ♀️";
        }

        let relationshipStatus = data.relationship_status ? data.relationship_status : "Chưa cập nhật.";
        let significantOther = data.significant_other ? data.significant_other.name : "Không có.";

        // --- Bắt đầu tin nhắn chính ---
        let resultMessage = `
🌟 **THÔNG TIN FACEBOOK CÁ NHÂN** 🌟
━━━━━━━━━━━━━━━━━━
👤 **Người Dùng:**
   • **Tên:** ${data.name || "N/A"}
   • **UID:** ${data.id || "N/A"}
   • **Username:** ${data.username || "Không có username"}
   • **Ngày sinh:** ${data.birthday ? moment(data.birthday, 'MM/DD/YYYY').format('DD/MM/YYYY') : "Không có"}
   • **Giới tính:** ${gender}
   • **Tiểu sử:** ${data.about || "Không có"}
   • **Trích dẫn yêu thích:** ${data.quotes || "Không có"}
   • **Tình trạng quan hệ:** ${relationshipStatus} ${significantOther !== "Không có." ? `(với ${significantOther})` : ''}

🌐 **Kết Nối & Địa Điểm:**
   • **Link FB:** ${data.link || "N/A"}
   • **Website:** ${data.website || "Không có"}
   • **Ngôn ngữ:** ${data.locale || "Không xác định"}
   • **Đến từ:** ${data.hometown?.name || "Không có"}
   • **Người theo dõi:** ${formattedFollowers}

⏰ **Thời Gian:**
   • **Ngày tạo tài khoản:** ${moment(data.created_time).format('DD-MM-YYYY')}
   • **Cập nhật cuối:** ${moment(data.updated_time).format('DD-MM-YYYY')}

`;

        // --- Thông tin Công việc ---
        if (data.work && data.work.length > 0) {
            resultMessage += `💼 **Công Việc:**\n`;
            data.work.forEach((job, index) => {
                resultMessage += `   • **Công việc ${index + 1}:**\n`;
                resultMessage += `     • **Công ty:** ${job.employer?.name || "N/A"}\n`;
                resultMessage += `     • **Vị trí:** ${job.position?.name || "Không có"}\n`;
                resultMessage += `     • **Địa điểm:** ${job.location?.name || "Không có"}\n`;
                resultMessage += `     • **Bắt đầu:** ${job.start_date ? moment(job.start_date).format('DD/MM/YYYY') : "Không xác định"}\n`;
                resultMessage += `     • **Mô tả:** ${job.description || "Không có"}\n`;
            });
            resultMessage += "\n";
        }

        // --- Thông tin Học vấn ---
        if (data.education && data.education.length > 0) {
            resultMessage += `🎓 **Học Vấn:**\n`;
            data.education.forEach((edu, index) => {
                resultMessage += `   • **Học vấn ${index + 1}:**\n`;
                resultMessage += `     • **Trường:** ${edu.school?.name || "N/A"}\n`;
                resultMessage += `     • **Loại:** ${edu.type || "N/A"}\n`;
                resultMessage += `     • **Chuyên ngành:** ${edu.concentration ? edu.concentration.map(c => c.name).join(", ") : "Không có"}\n`;
                resultMessage += `     • **Năm:** ${edu.year?.name || "Không xác định"}\n`;
            });
            resultMessage += "\n";
        }

        // --- Thông tin Quyền riêng tư ---
        resultMessage += `🛡️ **Quyền Riêng Tư:**\n`;
        resultMessage += `   • **Nội dung:** ${data.privacy?.description || "Công khai"}\n`;
        resultMessage += `   • **Ai có thể xem:** ${data.privacy?.value || "Mọi người"}\n`;
        resultMessage += `━━━━━━━━━━━━━━━━━━`;

        api.sendMessage(resultMessage, event.threadID, event.messageID);

    } catch (error) {
        console.error("Lỗi khi lấy thông tin Facebook:", error);
        api.sendMessage("❌ Có lỗi xảy ra khi lấy thông tin Facebook. Có thể UID không tồn tại hoặc API đang gặp sự cố. Vui lòng thử lại sau!", event.threadID, event.messageID);
    }
};