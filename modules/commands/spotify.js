const axios = require("axios");
const fs = require("fs-extra"); // Dùng fs-extra để dễ thao tác với file
const path = require("path");

module.exports.config = {
    name: "spotify",
    version: "1.1.1", // Nâng version lên để đánh dấu thay đổi
    hasPermssion: 0,
    credits: "DongDev (Modded by qh và Gemini) 👑", // Thêm credit của mày và tao
    description: "🎵 Tìm kiếm và tải nhạc MP3 từ Spotify một cách nhanh chóng! 🚀",
    commandCategory: "Giải Trí", // Đổi sang category Giải Trí cho hợp lý
    usages: "[tên bài hát hoặc link spotify]",
    cooldowns: 5, // Tăng cooldown để tránh spam API
};

// Hàm tìm kiếm trên Spotify
async function searchSpotify(keywords, limit = 5) { // Giới hạn 5 kết quả cho gọn
    try {
        const res = await axios.get(`https://subhatde.id.vn/spotify?q=${encodeURIComponent(keywords)}`);
        return res.data.slice(0, limit);
    } catch (error) {
        console.error("❌ Lỗi khi tìm kiếm Spotify:", error.response ? error.response.data : error.message);
        throw new Error("Không thể tìm kiếm nhạc Spotify lúc này. 😥 Vui lòng thử lại sau!");
    }
}

// Hàm tải nhạc từ Spotify
async function downloadSpotify(url) {
    try {
        const res = await axios.get(`https://subhatde.id.vn/spotify/down?url=${encodeURIComponent(url)}`);
        if (!res.data || !res.data.success) {
            throw new Error(res.data.message || "Không thể tải bài hát này. 😕");
        }
        return res.data;
    } catch (error) {
        console.error("❌ Lỗi khi tải nhạc Spotify:", error.response ? error.response.data : error.message);
        throw new Error("Xin lỗi, tôi không thể tải bài hát này. 🙁 Vui lòng thử link khác hoặc thử lại sau.");
    }
}

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const keyword = args.join(" ").trim();

    if (!keyword) {
        return api.sendMessage("⚠️ Bạn quên nhập từ khóa rồi! Hãy nhập tên bài hát hoặc link Spotify bạn muốn tìm nhé. 🎶", threadID, messageID);
    }

    api.sendMessage("🔍 Đang tìm kiếm nhạc trên Spotify, đợi chút xíu nha... ✨", threadID, messageID);

    try {
        const dataSearch = await searchSpotify(keyword);

        if (!dataSearch || dataSearch.length === 0) {
            return api.sendMessage(`❎ Không tìm thấy bài hát nào phù hợp với từ khóa "${keyword}". Bạn thử lại với từ khóa khác xem sao? 🤔`, threadID, messageID);
        }

        // Bỏ phần xử lý và gửi ảnh thumbnail ở đây
        const messages = dataSearch.map((item, index) => {
            return `\n${index + 1}. 🎵 ${item.title}\n   ✨ Nghệ sĩ: ${item.artist}\n   ⏳ Thời lượng: ${item.duration}\n`;
        });

        const listTrack = {
            body: `🎶 Đây là các kết quả tìm kiếm cho "${keyword}":\n${messages.join("")}\n\n👉 Hãy reply (phản hồi) theo số thứ tự của bài hát bạn muốn tải nhé! 📥`,
            // Không còn attachment ở đây
        };

        api.sendMessage(listTrack, threadID, (error, info) => {
            if (error) {
                console.error("❌ Lỗi gửi tin nhắn danh sách:", error);
                return api.sendMessage("Oops! Có lỗi khi hiển thị danh sách bài hát. 😭", threadID, messageID);
            }
            // Lưu handleReply để xử lý lựa chọn của người dùng
            global.client.handleReply.push({
                type: "choose",
                name: module.exports.config.name,
                author: event.senderID, // Lưu senderID của người dùng để chỉ người đó mới được reply
                messageID: info.messageID, // ID của tin nhắn chứa danh sách
                dataTrack: dataSearch,
            });
        }, messageID);
    } catch (error) {
        console.error("❌ Lỗi trong quá trình chạy lệnh Spotify:", error);
        api.sendMessage(`Lỗi rồi qh ơi! 🥺 ${error.message}`, threadID, messageID);
    }
};

module.exports.handleReply = async function ({ event, api, handleReply }) {
    const { threadID, senderID, body } = event;

    // Đảm bảo chỉ người đã dùng lệnh mới có thể reply
    if (senderID !== handleReply.author) {
        return api.sendMessage("🚫 Bạn không phải người đã yêu cầu lệnh này, vui lòng dùng lệnh mới nhé! 😬", threadID);
    }

    if (handleReply.type === 'choose') {
        const choice = parseInt(body);

        if (isNaN(choice) || choice <= 0 || choice > handleReply.dataTrack.length) {
            return api.sendMessage('⚠️ Lựa chọn của bạn không hợp lệ. Hãy nhập số thứ tự của bài hát trong danh sách nhé! 🔢', threadID);
        }

        const chosenItem = handleReply.dataTrack[choice - 1];

        api.sendMessage(`🔄 Tuyệt vời! Đang chuẩn bị tải "${chosenItem.title}" cho bạn đây... Xin chờ giây lát nha! ⏳`, threadID);

        try {
            const downloadData = await downloadSpotify(chosenItem.url);

            const filePath = path.join(__dirname, 'cache', `${chosenItem.title}_${chosenItem.id}.mp3`); // Tên file độc đáo hơn
            await fs.ensureDir(path.dirname(filePath)); // Đảm bảo thư mục cache tồn tại

            // Tải và lưu file MP3
            const response = await axios({
                url: downloadData.downloadUrl,
                method: 'GET',
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Gửi tin nhắn kèm file
            api.sendMessage({
                body: `🎧 Đây là bài hát của bạn: "${downloadData.title}"\n• Ca sĩ: ${downloadData.artist}\n• Album: ${downloadData.album}\n• Phát hành: ${downloadData.released}\n\nChúc bạn nghe nhạc vui vẻ! 🎉`,
                attachment: fs.createReadStream(filePath)
            }, threadID, async (err, info) => {
                if (err) {
                    console.error("❌ Lỗi gửi file nhạc:", err);
                    return api.sendMessage("Xin lỗi, có vẻ tôi không thể gửi file nhạc này. 😭", threadID);
                }
                // Xóa tin nhắn danh sách và file nhạc sau khi gửi thành công
                try {
                    api.unsendMessage(handleReply.messageID); // Gỡ tin nhắn chứa danh sách bài hát
                    await fs.unlink(filePath); // Xóa file nhạc
                    console.log(`✅ Đã xóa file nhạc: ${filePath}`);
                } catch (cleanError) {
                    console.error("⚠️ Lỗi khi xóa tin nhắn/file nhạc:", cleanError);
                }
            }, event.messageID); // Reply vào tin nhắn của người dùng

        } catch (error) {
            console.error("❌ Lỗi xử lý tải xuống trong handleReply:", error);
            api.sendMessage(`Ôi không! 🤯 ${error.message || 'Đã xảy ra lỗi khi tải bài hát.'} Vui lòng thử lại sau nhé!`, threadID);
            // Đảm bảo xóa file tạm nếu có lỗi trong quá trình tải/gửi
            const tempFilePath = path.join(__dirname, 'cache', `${chosenItem.title}_${chosenItem.id}.mp3`);
            if (fs.existsSync(tempFilePath)) {
                try {
                    await fs.unlink(tempFilePath);
                    console.log(`🗑️ Đã xóa file tạm: ${tempFilePath}`);
                } catch (e) {
                    console.error(`❌ Lỗi khi xóa file tạm: ${tempFilePath}`, e);
                }
            }
        }
    }
};