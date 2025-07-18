const axios = require('axios');
const fs = require('fs-nextra');
const path = require('path');

module.exports.config = {
    name: "4k",
    version: "1.0.2", // ⬆️ Nâng version lên xíu vì đã đổi API
    hasPermssion: 0,
    credits: "modded by qh and Gemini ✨", // 🤝 Giữ nguyên credits gốc và thêm tên chúng ta
    description: "⚡️ tăng độ phân giải ảnh lên 4k siêu nét bằng deepai.org! 📸", // 💖 Chữ thường, viết hoa đầu dòng + icon, thêm deepai
    commandCategory: "tiện ích 🛠️", // 🌟 Chữ thường, viết hoa đầu dòng + icon
    usages: "[reply ảnh hoặc link ảnh]", // 💡 Súc tích, dễ hiểu hơn
    cooldowns: 10 // ⏰ Tăng cooldown lên 10 giây cho API DeepAI, tránh bị rate-limit
};

module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const cacheDir = path.resolve(__dirname, 'cache');

    // 🔗 API Key của DeepAI.org
    const DEEPAI_API_KEY = "3EBF03E9-1E8D-428A-AB1B-17E145537746";
    const DEEPAI_API_URL = "https://api.deepai.org/api/torch-srgan"; // Hoặc "waifu2x" tùy loại mô hình mong muốn

    // 📥 Lấy link ảnh từ reply hoặc args
    let inputImageUrl;
    if (messageReply && messageReply.attachments && messageReply.attachments.length > 0 && messageReply.attachments[0].type === "photo") {
        inputImageUrl = messageReply.attachments[0].url;
    } else if (args[0] && /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(args[0])) {
        inputImageUrl = args[0];
    } else {
        // 💬 Yêu cầu người dùng cung cấp ảnh
        return api.sendMessage('⚠️ Bạn ơi, vui lòng reply một ảnh hoặc nhập link ảnh để tớ xử lý nhé! 🖼️', threadID, messageID);
    }

    // ⚙️ Kiểm tra và tạo thư mục cache nếu chưa có
    if (!await fs.exists(cacheDir)) {
        await fs.mkdir(cacheDir);
    }

    const upscaledImagePath = path.join(cacheDir, `upscaled_deepai_${threadID}_${messageID}.png`);

    let processingMessage; // Biến để lưu trữ tin nhắn "đang xử lý"

    try {
        // 🔄 Thông báo đang xử lý
        processingMessage = await api.sendMessage("⏳ Đang tăng độ phân giải cho ảnh của bạn bằng DeepAI.org... Vui lòng chờ chút nhé! ✨", threadID);

        // ⚡️ Gọi API DeepAI để tăng độ phân giải
        const response = await axios.post(
            DEEPAI_API_URL,
            { image: inputImageUrl }, // DeepAI nhận URL ảnh trực tiếp
            {
                headers: {
                    "api-key": DEEPAI_API_KEY
                }
            }
        );

        // 🔍 Kiểm tra dữ liệu trả về từ API
        if (!response.data || !response.data.output_url) {
            console.error("API DeepAI không trả về link ảnh:", response.data);
            return api.sendMessage("❌ Có lỗi từ phía API DeepAI. Không nhận được ảnh đã xử lý. Vui lòng thử lại sau nhé! 💔", threadID, messageID);
        }

        const upscaleImageLink = response.data.output_url;

        // 🖼️ Tải ảnh đã tăng độ phân giải về
        const imageResponse = await axios.get(upscaleImageLink, { responseType: "arraybuffer" });
        await fs.writeFileSync(upscaledImagePath, Buffer.from(imageResponse.data, "binary"));

        // ✅ Gửi ảnh về cho người dùng
        await api.sendMessage({
            body: `✨ Ảnh của bạn đã được làm nét và nâng cấp lên 4K xong rồi đây! Siêu phẩm luôn nhé! 🤩`,
            attachment: fs.createReadStream(upscaledImagePath)
        }, threadID, messageID);

    } catch (e) {
        console.error("Lỗi trong lệnh 4k (DeepAI):", e); // Log lỗi chi tiết để debug

        let errorMessage = "❌ Đã xảy ra lỗi không mong muốn khi xử lý ảnh bằng DeepAI. Vui lòng thử lại sau. 😥";
        if (e.response) {
            // Lỗi từ phản hồi HTTP của API DeepAI
            if (e.response.status === 401 || e.response.status === 403) { // 401 Unauthorized, 403 Forbidden
                errorMessage = "🔑 Lỗi xác thực API: API key của DeepAI không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại nhé! 🧐";
            } else if (e.response.status === 400) { // 400 Bad Request
                errorMessage = "🔗 Link ảnh bạn cung cấp không hợp lệ hoặc DeepAI không thể xử lý được ảnh này. Thử lại với ảnh khác nhé! 💔";
            } else if (e.response.status === 429) { // 429 Too Many Requests
                errorMessage = "⏳ API DeepAI đang bận hoặc bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ vài phút rồi thử lại nhé! 🚦";
            } else {
                errorMessage = `API DeepAI trả về lỗi ${e.response.status}. Có thể dịch vụ đang gặp sự cố. ⚠️`;
            }
        } else if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
            errorMessage = "🌐 Không thể kết nối đến máy chủ DeepAI. Có thể do lỗi mạng hoặc dịch vụ đang bảo trì. 🚦";
        } else if (e.message.includes("ENOENT")) {
            errorMessage = "📂 Lỗi file: Không tìm thấy ảnh trong cache. Vui lòng thử lại nhé! 🤷‍♀️";
        }

        api.sendMessage(errorMessage, threadID, messageID);
    } finally {
        // 🗑️ Luôn luôn xóa các file cache và tin nhắn "đang xử lý"
        if (await fs.exists(upscaledImagePath)) {
            await fs.unlink(upscaledImagePath).catch(err => console.error("Lỗi khi xóa upscaled image cache:", err));
        }
        if (processingMessage && processingMessage.messageID) {
            await api.unsendMessage(processingMessage.messageID).catch(err => console.error("Lỗi khi xóa tin nhắn đang xử lý:", err));
        }
    }
};