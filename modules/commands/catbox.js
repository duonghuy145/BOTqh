module.exports = {
    config: {
        name: 'catbox',
        commandCategory: 'Tiện Ích', // Đổi category thành Tiện Ích
        hasPermssion: 0,
        credits: 'tdunguwu (Đã điều chỉnh bởi qh và Gemini) 👑', // Cập nhật credit
        usages: 'Phản hồi (reply) ảnh/video/GIF để tạo liên kết Catbox.', // Sửa lại usages
        description: '⬆️ Tải lên hình ảnh, video, hoặc GIF lên Catbox và nhận liên kết trực tiếp.', // Sửa lại description
        cooldowns: 5 // Thêm cooldown để tránh spam API
    },
    run: async (o) => {
        const { api, event } = o;
        const { threadID, messageID, type, messageReply } = event;

        // Kiểm tra nếu không phải là reply tin nhắn hoặc không có tệp đính kèm
        if (type !== "message_reply" || !messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("⚠️ Vui lòng phản hồi (reply) một hình ảnh, video hoặc GIF để tôi có thể tạo liên kết Catbox.", threadID, messageID);
        }

        const axios = require('axios');
        let results = []; // Mảng để lưu trữ kết quả của từng tệp

        api.sendMessage("🔄 Đang tiến hành tải lên tệp tin của bạn lên Catbox... Vui lòng chờ. ⏳", threadID, messageID);

        for (const attachment of messageReply.attachments) {
            try {
                // Chỉ xử lý các loại tệp là ảnh hoặc video
                if (attachment.type === "photo" || attachment.type === "animated_image" || attachment.type === "video") {
                    const response = await axios.get(`https://catbox-mnib.onrender.com/upload?url=${encodeURIComponent(attachment.url)}`);
                    if (response.data && response.data.url) {
                        results.push(`✅ ${attachment.type === "photo" ? "Ảnh" : attachment.type === "video" ? "Video" : "GIF"}: ${response.data.url}`);
                    } else {
                        results.push(`❌ Tệp tin không xác định: Không thể tạo liên kết. (ID: ${attachment.ID})`);
                    }
                } else {
                    results.push(`⚠️ Tệp tin không được hỗ trợ (Loại: ${attachment.type}). Bỏ qua.`);
                }
            } catch (error) {
                console.error(`❌ Lỗi khi tải lên tệp ${attachment.url}:`, error);
                results.push(`❌ Lỗi khi tải lên tệp tin (ID: ${attachment.ID}). Vui lòng thử lại. ${error.message ? `Chi tiết: ${error.message}` : ''}`);
            }
        }

        if (results.length === 0) {
            return api.sendMessage("⚠️ Không có tệp tin hợp lệ nào được tìm thấy để tải lên Catbox.", threadID, messageID);
        }

        // Gửi kết quả cuối cùng
        return api.sendMessage(`✨ Kết quả tải lên Catbox:\n\n${results.join('\n')}\n\nHy vọng bạn hài lòng! 🎉`, threadID);
    }
};