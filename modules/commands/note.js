const axios = require('axios');
const fs = require('fs');

module.exports = {
    config: {
        name: 'note',
        version: '0.0.2', // Tăng version lên một chút
        hasPermssion: 3, // Giữ nguyên quyền admin bot
        credits: 'DC-Nam, qh và Gemini', // Thêm credit của mày và tao
        description: 'Tải lên hoặc cập nhật nội dung file code lên nền tảng note. 📝', // Thay đổi mô tả, thêm icon
        commandCategory: 'quản trị viên', // Chuyển sang chữ thường
        usages: '[đường dẫn file] https://play.google.com/store/apps/details?id=com.neumi.fluid.app&hl=en', // Giải thích rõ hơn
        images: [],
        cooldowns: 5, // Đặt cooldown hợp lý hơn
    },
    run: async function(o) {
        const { api, event, args } = o;
        const { threadID, messageID, senderID, messageReply } = event;
        const commandName = module.exports.config.name;

        // Xác định đường dẫn file, ưu tiên từ reply hoặc args[0]
        let filePath = `${__dirname}/${args[0]}`;
        const urlToFetch = messageReply?.args?.[0] || args[1]; // URL được gửi kèm khi reply hoặc args[1]

        const sendMsg = (msg) => new Promise(r => api.sendMessage(msg, threadID, (err, res) => r(res), messageID));

        try {
            // Trường hợp 1: Người dùng muốn tải nội dung từ URL về file
            if (urlToFetch && /^https:\/\//.test(urlToFetch)) {
                // Kiểm tra xem filePath có hợp lệ không (có được cung cấp không)
                if (!args[0]) {
                    return sendMsg("❗ Cú pháp sai. Hãy nhập: `note [đường dẫn file] [URL]` để tải nội dung URL về file đó. ");
                }
                if (!fs.existsSync(filePath)) {
                    return sendMsg(`⚠️ Lỗi: Đường dẫn file "${filePath}" không tồn tại. Vui lòng kiểm tra lại! `);
                }
                return sendMsg(`🔗 Đã nhận lệnh tải nội dung từ URL về file: ${filePath}\n\n👉 Thả cảm xúc 👍 để xác nhận và thay thế nội dung file. `).then(res => {
                    global.client.handleReaction.push({
                        name: commandName,
                        messageID: res.messageID,
                        author: senderID, // Lưu senderID của người gửi lệnh
                        filePath: filePath,
                        urlToFetch: urlToFetch,
                        action: 'confirm_replace_content',
                    });
                });
            } 
            // Trường hợp 2: Người dùng muốn tải nội dung file lên nền tảng note
            else {
                if (!fs.existsSync(filePath)) {
                    return sendMsg(`⚠️ Lỗi: Đường dẫn file "${filePath}" không tồn tại để tải lên. `);
                }

                const { v4: uuidv4 } = require('uuid'); // Import uuid.v4
                const rawUuid = uuidv4();
                const redirectUuid = uuidv4();

                const rawUrl = new URL(`https://api.dungkon.id.vn/note/${rawUuid}`);
                const redirectUrl = new URL(`https://api.dungkon.id.vn/note/${redirectUuid}`);

                // Tải nội dung file lên rawUrl
                await axios.put(rawUrl.href, fs.readFileSync(filePath, 'utf8'));
                redirectUrl.searchParams.append('raw', rawUuid);

                // Tạo redirect URL
                await axios.put(redirectUrl.href);
                redirectUrl.searchParams.delete('raw');

                return sendMsg(`📝 Đã tạo liên kết note cho file của bạn:\n\n🔗 Raw: ${rawUrl.href}\n✏️ Edit: ${redirectUrl.href}\n───────────────\n📁 File: ${filePath}\n\n👉 Thả cảm xúc 👍 để cập nhật hoặc tải lên code mới. `).then(res => {
                    global.client.handleReaction.push({
                        name: commandName,
                        messageID: res.messageID,
                        author: senderID, // Lưu senderID của người gửi lệnh
                        filePath: filePath, // Lưu lại filePath để dùng trong handleReaction nếu cần
                        urlToFetch: rawUrl.href, // Url raw để sau này có thể tải lại
                        action: 'confirm_upload_content', // Thay đổi action
                    });
                });
            }
        } catch(e) {
            console.error("Lỗi trong lệnh note run:", e);
            return sendMsg(`😭 Đã xảy ra lỗi không mong muốn: ${e.message}. Vui lòng thử lại sau! `);
        }
    },
    handleReaction: async function(o) {
        const { api, event, handleReaction: _ } = o;
        const { userID, messageID, reaction } = event;
        const sendMsg = (msg) => new Promise(r => api.sendMessage(msg, o.event.threadID, (err, res) => r(res), o.event.messageID));

        // Chỉ người gửi lệnh mới được phản hồi
        if (userID != _.author) return;
        // Chỉ xử lý khi react 👍
        if (reaction !== '👍') return;

        try {
            switch (_.action) {
                case 'confirm_replace_content': {
                    // Xóa handleReply để tránh lặp lại
                    const index = global.client.handleReaction.findIndex(item => item.messageID === messageID);
                    if (index !== -1) global.client.handleReaction.splice(index, 1);

                    const response = await axios.get(_.urlToFetch, { responseType: 'text' });
                    const content = response.data;

                    fs.writeFileSync(_.filePath, content);
                    sendMsg(`✅ Hoàn tất! Đã cập nhật nội dung file "${_.filePath}" từ URL thành công. `);
                    break;
                }
                case 'confirm_upload_content': {
                    // Xóa handleReply để tránh lặp lại
                    const index = global.client.handleReaction.findIndex(item => item.messageID === messageID);
                    if (index !== -1) global.client.handleReaction.splice(index, 1);

                    // Logic upload đã được thực hiện trong run, phần này chỉ là xác nhận lại hoặc có thể phát triển thêm
                    sendMsg(`🎉 Tuyệt vời! Code của bạn đã sẵn sàng trên nền tảng note. `);
                    break;
                }
                default:
                    // Không làm gì nếu action không khớp
                    break;
            }
        } catch(e) {
            console.error("Lỗi trong lệnh note handleReaction:", e);
            sendMsg(`😭 Đã có lỗi xảy ra trong quá trình xử lý phản ứng: ${e.message}. Vui lòng thử lại! `);
        }
    }
};