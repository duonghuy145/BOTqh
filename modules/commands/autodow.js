const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

// Đường dẫn lưu cache và trạng thái
const cacheDir = path.join(__dirname, "cache");
const settingsPath = path.join(cacheDir, "autodown_settings.json");

// Kiểm tra thư mục cache, nếu chưa có thì tạo mới
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

// Trạng thái mặc định cho các dịch vụ
let settings = {
    isTikTokEnabled: true,
    isSoundCloudEnabled: true,
    isDouyinEnabled: true,
    isFacebookEnabled: true,
    isYouTubeEnabled: true,
    isDownAIOEnabled: true,
};

// Tải trạng thái từ file hoặc tạo file mới với trạng thái mặc định
if (fs.existsSync(settingsPath)) {
    try {
        settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
    } catch (e) {
        console.error("❌ Lỗi khi đọc file cài đặt autodown, sử dụng cài đặt mặc định:", e);
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2)); // Ghi lại file mặc định nếu lỗi
    }
} else {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Hàm lưu trạng thái vào file
function saveSettings() {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
}

// Hàm tải file từ URL
async function streamURL(url, type) {
    const res = await axios.get(url, {
        responseType: "arraybuffer"
    });
    const filePath = `${cacheDir}/${Date.now()}.${type}`;
    fs.writeFileSync(filePath, res.data);
    return fs.createReadStream(filePath);
}

// Hàm lấy thông tin từ TikTok
async function infoPostTT(url) {
    const res = await axios.post("https://tikwm.com/api/", {
        url
    }, {
        headers: {
            "content-type": "application/json"
        }
    });
    return res.data.data;
}

// Hàm kiểm tra link Douyin
function isDouyinVideoLink(link) {
    return /douyin\.com/.test(link);
}

// Xử lý sự kiện chính
exports.handleEvent = async function(o) {
    try {
        const str = o.event.body;
        const send = (msg) => o.api.sendMessage(msg, o.event.threadID, o.event.messageID);

        // Đảm bảo str là một chuỗi trước khi sử dụng .match()
        const links = typeof str === 'string' ? str.match(/(https?:\/\/[^)\s]+)/g) || [] : [];

        // Xử lý lệnh bật/tắt nhanh
        if (typeof str === 'string' && str.startsWith("autodown")) {
            const args = str.split(" ");
            switch (args[1]) {
                case "-s":
                    settings.isSoundCloudEnabled = !settings.isSoundCloudEnabled;
                    saveSettings();
                    return send(`🎶 SoundCloud đã được ${settings.isSoundCloudEnabled ? "✅ BẬT" : "❌ TẮT"}!`);
                case "-t":
                    settings.isTikTokEnabled = !settings.isTikTokEnabled;
                    saveSettings();
                    return send(`🎵 TikTok đã được ${settings.isTikTokEnabled ? "✅ BẬT" : "❌ TẮT"}!`);
                case "-d":
                    settings.isDouyinEnabled = !settings.isDouyinEnabled;
                    saveSettings();
                    return send(`🇨🇳 Douyin đã được ${settings.isDouyinEnabled ? "✅ BẬT" : "❌ TẮT"}!`);
                case "-f":
                    settings.isFacebookEnabled = !settings.isFacebookEnabled;
                    saveSettings();
                    return send(`📘 Facebook đã được ${settings.isFacebookEnabled ? "✅ BẬT" : "❌ TẮT"}!`);
                case "-aio":
                    settings.isDownAIOEnabled = !settings.isDownAIOEnabled;
                    saveSettings();
                    return send(`🔗 DownAIO (Tải Đa Nền Tảng) đã được ${settings.isDownAIOEnabled ? "✅ BẬT" : "❌ TẮT"}!`);
                case "-y":
                    settings.isYouTubeEnabled = !settings.isYouTubeEnabled;
                    saveSettings();
                    return send(`▶️ YouTube đã được ${settings.isYouTubeEnabled ? "✅ BẬT" : "❌ TẮT"}!`);
                case "-all":
                    const newState = !settings.isTikTokEnabled; // Lấy trạng thái ngược lại của TikTok (hoặc bất kỳ cái nào)
                    settings.isTikTokEnabled = newState;
                    settings.isSoundCloudEnabled = newState;
                    settings.isDouyinEnabled = newState;
                    settings.isFacebookEnabled = newState;
                    settings.isYouTubeEnabled = newState;
                    settings.isDownAIOEnabled = newState;
                    saveSettings();
                    return send(`✨ Tất cả các dịch vụ tự động tải đã được ${newState ? "✅ BẬT" : "❌ TẮT"}!`);
                default:
                    return send(`
[ ⬇️ MENU TỰ ĐỘNG TẢI ⬇️ ]
🎵 TikTok: ${settings.isTikTokEnabled ? "✅ BẬT" : "❌ TẮT"}
🎶 SoundCloud: ${settings.isSoundCloudEnabled ? "✅ BẬT" : "❌ TẮT"}
🇨🇳 Douyin: ${settings.isDouyinEnabled ? "✅ BẬT" : "❌ TẮT"}
📘 Facebook: ${settings.isFacebookEnabled ? "✅ BẬT" : "❌ TẮT"}
▶️ YouTube: ${settings.isYouTubeEnabled ? "✅ BẬT" : "❌ TẮT"}
🔗 DownAIO (Đa Nền Tảng): ${settings.isDownAIOEnabled ? "✅ BẬT" : "❌ TẮT"}

⚙️ **Cách Dùng Lệnh Nhanh:**
- Gõ: \`autodown -<chữ cái đầu>\`
- Ví dụ: \`autodown -t\` để bật/tắt TikTok
- \`autodown -aio\` để bật/tắt DownAIO
- \`autodown -all\` để bật/tắt toàn bộ dịch vụ tự động tải.
`);
            }
        }

        // Xử lý tự động tải link
        for (const link of links) {
            if (/soundcloud\.com/.test(link) && settings.isSoundCloudEnabled) {
                try {
                    const res = await axios.get(`https://nguyenmanh.name.vn/api/scDL?url=${link}&apikey=jn6PoPho`);
                    const {
                        title,
                        duration,
                        audio
                    } = res.data.result;
                    const audioPath = await streamURL(audio, "mp3");
                    send({
                        body: `🎶 [ SOUNDCLOUD ]\n📝 Tiêu Đề: ${title}\n⏰ Thời Gian: ${duration} giây`,
                        attachment: audioPath,
                    });
                } catch (e) {
                    console.error("Lỗi khi tải SoundCloud:", e);
                    send("❌ Tiếc quá! Đã xảy ra lỗi khi tải nội dung từ SoundCloud. Thử lại nhé! 🤔");
                }
            } else if (/(^https:\/\/)((vm|vt|www|v)\.)?(tiktok)\.com\//.test(link) && settings.isTikTokEnabled) {
                try {
                    const json = await infoPostTT(link);
                    if (!json || (!json.images && !json.play)) {
                        send("❌ Không tìm thấy dữ liệu TikTok hợp lệ để tải.");
                        continue;
                    }
                    const attachment = json.images ?
                        await Promise.all(json.images.map((img) => streamURL(img, "png"))) :
                        await streamURL(json.play, "mp4");
                    send({
                        body: `🎵 [ TIKTOK ]\n👤 Tên Kênh: ${json.author.nickname}\n📝 Tiêu Đề: ${json.title}`,
                        attachment,
                    });
                } catch (e) {
                    console.error("Lỗi khi tải TikTok:", e);
                    send("❌ Đã xảy ra lỗi khi tải nội dung từ TikTok. Có thể link không hợp lệ hoặc API đang bận. 🥲");
                }
            } else if (settings.isDouyinEnabled && isDouyinVideoLink(link)) {
                try {
                    const res = await axios.get(`https://subhatde.id.vn/tiktok/douyindl?url=${link}`);
                    const videoData = res.data;
                    if (videoData.attachments?.length) {
                        const videoStream = await streamURL(videoData.attachments[0].url, "mp4");
                        send({
                            body: `🇨🇳 [ DOUYIN ]\n📝 Tiêu Đề: ${videoData.caption || "Không có tiêu đề"}`,
                            attachment: videoStream,
                        });
                    } else {
                        send("❌ Không tìm thấy video Douyin để tải.");
                    }
                } catch (e) {
                    console.error("Lỗi khi tải Douyin:", e);
                    send("❌ Đã xảy ra lỗi khi tải nội dung từ Douyin. Có thể link không hợp lệ hoặc API đang bận. 😥");
                }
            } else if (/fb|facebook\.com/.test(link) && settings.isFacebookEnabled) {
                try {
                    const res = await axios.get(`https://private.azig.dev/media/downAIO?url=${encodeURIComponent(link)}&apikey=i0qCPytSXf`);
                    const {
                        title,
                        medias
                    } = res.data.data;
                    if (medias?.length) {
                        const attachments = await Promise.all(
                            medias.map((media) => streamURL(media.url, media.type === "video" ? "mp4" : media.extension))
                        );
                        send({
                            body: `📘 [ FACEBOOK ]\n📝 Tiêu Đề: ${title || "Không có tiêu đề"}`,
                            attachment: attachments,
                        });
                    } else {
                        send("❌ Không tìm thấy nội dung Facebook để tải.");
                    }
                } catch (e) {
                    console.error("Lỗi khi tải Facebook:", e);
                    send("❌ Đã xảy ra lỗi khi tải nội dung từ Facebook. Có thể link không hợp lệ hoặc API đang bận. 😞");
                }
            }
            // Thêm xử lý cho YouTube và DownAIO nếu API có sẵn
            // Ví dụ:
            // else if (/(youtube\.com|youtu\.be)/.test(link) && settings.isYouTubeEnabled) {
            //     try {
            //         // Thêm code tải YouTube tại đây
            //     } catch (e) {
            //         send("❌ Lỗi khi tải YouTube.");
            //     }
            // } else if (settings.isDownAIOEnabled && /* logic nhận diện link cho DownAIO */) {
            //     try {
            //         // Thêm code tải DownAIO tại đây
            //     } catch (e) {
            //         send("❌ Lỗi khi tải DownAIO.");
            //     }
            // }
        }
    } catch (error) {
        console.error("Lỗi tổng quát trong autodow.js:", error);
    }
};

exports.run = () => {};

exports.config = {
    name: "autodown",
    version: "3.1.0",
    hasPermssion: 0,
    credits: "ChatGPT & qh & Gemini 💖", // Đã bổ sung credits cho Gemini và qh
    description: "Tự động tải link (TikTok, SoundCloud, Douyin, Facebook, YouTube, Đa Nền Tảng)", // Cập nhật mô tả
    commandCategory: "tiện ích", // Đổi sang chữ thường
    usages: ["autodown", "autodown -t", "autodown -all"], // Thêm ví dụ
    cooldowns: 3,
};