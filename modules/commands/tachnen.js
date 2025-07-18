const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs-nextra'); // Sử dụng fs-nextra để tận dụng Promise-based file operations
const path = require('path');
const { image } = require('image-downloader'); // Vẫn giữ image-downloader vì nó tiện cho việc tải ảnh

module.exports.config = {
    name: 'tachnen',
    version: '1.1.2', // Nâng version lên xíu ⬆️
    hasPermssion: 0,
    credits: 'Vihoo, modded by qh and Gemini ✨', // Giữ nguyên credits gốc và thêm tên chúng ta
    description: 'tách nền ảnh ngay lập tức! 🖼️', // Chữ thường, viết hoa đầu dòng + icon
    commandCategory: 'tiện ích 🛠️', // Chữ thường, viết hoa đầu dòng + icon
    usages: '[reply ảnh]', // Súc tích hơn
    cooldowns: 5 // Tăng cooldown lên 5 giây
};

module.exports.run = async function({ api, event }) { // Bỏ args vì không dùng cho URL ảnh
    const { threadID, messageID, type, messageReply } = event;
    const cacheDir = path.resolve(__dirname, 'cache');
    const inputPath = path.join(cacheDir, `original_${threadID}_${messageID}.png`); // Tên file rõ ràng hơn
    const outputPath = path.join(cacheDir, `no_background_${threadID}_${messageID}.png`); // Tên file rõ ràng hơn

    // Danh sách API Keys (lưu ý: nên bảo mật các key này, không nên hardcode trực tiếp trong code public nếu có thể)
    const apiKeys = [
        "t4Jf1ju4zEpiWbKWXxoSANn4", "CTWSe4CZ5AjNQgR8nvXKMZBd", "PtwV35qUq557yQ7ZNX1vUXED",
        "wGXThT64dV6qz3C6AhHuKAHV", "82odzR95h1nRp97Qy7bSRV5M", "4F1jQ7ZkPbkQ6wEQryokqTmo",
        "sBssYDZ8qZZ4NraJhq7ySySR", "NuZtiQ53S2F5CnaiYy4faMek", "f8fujcR1G43C1RmaT4ZSXpwW"
    ];

    try {
        if (type !== "message_reply" || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("Bạn phải reply một ảnh để tách nền nhé! ☝️", threadID, messageID); // Viết hoa đầu dòng + icon
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== "photo") {
            return api.sendMessage("Đây không phải là ảnh. Vui lòng reply một ảnh hợp lệ nhé! 🚫", threadID, messageID); // Viết hoa đầu dòng + icon
        }

        api.sendMessage("Đang tách nền cho ảnh của bạn... Vui lòng chờ chút nhé! ⏳", threadID, messageID); // Thông báo đang xử lý

        // Tạo thư mục cache nếu chưa tồn tại
        if (!fs.existsSync(cacheDir)) {
            await fs.mkdir(cacheDir);
        }

        // Tải ảnh gốc về cache
        await image({
            url: attachment.url,
            dest: inputPath
        });

        // Tạo FormData để gửi ảnh lên API
        const formData = new FormData();
        formData.append('size', 'auto');
        formData.append('image_file', fs.createReadStream(inputPath), path.basename(inputPath));

        // Chọn ngẫu nhiên một API Key
        const randomApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

        // Gửi yêu cầu tách nền
        const response = await axios({
            method: 'post',
            url: 'https://api.remove.bg/v1.0/removebg',
            data: formData,
            responseType: 'arraybuffer',
            headers: {
                ...formData.getHeaders(),
                'X-Api-Key': randomApiKey,
            },
            encoding: null // Để nhận dữ liệu nhị phân
        });

        // Xử lý phản hồi từ API
        if (response.status !== 200) {
            console.error('Lỗi từ API remove.bg:', response.status, response.statusText, response.data.toString('utf8'));
            if (response.status === 402) { // 402 Payment Required - Hết lượt sử dụng API
                return api.sendMessage("Rất tiếc, các API key đã hết lượt sử dụng trong hôm nay. Vui lòng thử lại vào ngày mai nhé! 😥", threadID, messageID);
            }
            return api.sendMessage("Đã xảy ra lỗi khi tách nền ảnh. Vui lòng thử lại sau. ❌", threadID, messageID); // Viết hoa đầu dòng + icon
        }

        // Lưu ảnh đã tách nền
        await fs.writeFileSync(outputPath, Buffer.from(response.data, 'binary'));

        // Gửi ảnh đã tách nền về người dùng
        await api.sendMessage({
            body: `Đã tách nền thành công ảnh của bạn! 🥳`, // Thêm body tin nhắn
            attachment: fs.createReadStream(outputPath)
        }, threadID, messageID);

    } catch (e) {
        console.error("Lỗi khi thực hiện lệnh tách nền:", e); // Log lỗi chi tiết
        let errorMessage = "Đã xảy ra lỗi không mong muốn khi tách nền ảnh. Vui lòng thử lại sau. 😥"; // Mặc định
        if (e.response && e.response.status === 402) {
             errorMessage = "Rất tiếc, các API key đã hết lượt sử dụng trong hôm nay. Vui lòng thử lại vào ngày mai nhé! 😥";
        } else if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
            errorMessage = "Không thể kết nối đến máy chủ tách nền. Có thể do lỗi mạng hoặc API đang bảo trì. 🌐";
        }
        api.sendMessage(errorMessage, threadID, messageID); // Viết hoa đầu dòng + icon
    } finally {
        // Luôn luôn xóa các file cache
        if (await fs.exists(inputPath)) {
            await fs.unlink(inputPath).catch(err => console.error("Lỗi khi xóa input cache:", err));
        }
        if (await fs.exists(outputPath)) {
            await fs.unlink(outputPath).catch(err => console.error("Lỗi khi xóa output cache:", err));
        }
    }
};