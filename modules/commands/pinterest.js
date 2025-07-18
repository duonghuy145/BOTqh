module.exports.config = {
    name: "pinterest",
    version: "1.0.4", // Tăng version
    hasPermssion: 0,
    credits: "D-Jukie (mod by qh và Gemini)",
    description: "Tìm kiếm hình ảnh trên Pinterest.",
    commandCategory: "Tìm kiếm",
    usages: "pinterest [từ khóa] hoặc [từ khóa] - [số ảnh]",
    cooldowns: 5,
};

module.exports.onLoad = () => {
    const fs = require("fs-extra");
    const path = require("path");
    const dirCache = path.join(__dirname, "cache");
    const defaultImagePath = path.join(dirCache, "pinterest_default.jpeg");

    if (!fs.existsSync(dirCache)) fs.mkdirSync(dirCache, { recursive: true });

    if (!fs.existsSync(defaultImagePath)) {
        const request = require("request");
        request("https://i.imgur.com/r1DtySa.jpeg").pipe(fs.createWriteStream(defaultImagePath));
    }
};

module.exports.run = async function({ api, event, args }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");
    const dirCache = path.join(__dirname, "cache");

    const keySearch = args.join(" ");

    let query;
    let numImages = 6;

    if (keySearch.includes("-")) {
        const parts = keySearch.split("-").map(part => part.trim());
        query = parts[0];
        const requestedNum = parseInt(parts[1]);
        if (!isNaN(requestedNum) && requestedNum > 0) {
            numImages = requestedNum;
        }
    } else {
        query = keySearch;
    }

    if (!query) {
        return api.sendMessage({
            body: '✨ ==== 「 PINTEREST 」==== ✨\n\n' + // Tiêu đề với icon
                  '👉 Vui lòng nhập từ khóa cần tìm kiếm 💌\n' + // Icon mũi tên, icon trái tim
                  'VD: pinterest doraemon hoặc pinterest doraemon - 10 ✨', // Icon lấp lánh
            attachment: fs.createReadStream(path.join(dirCache, "pinterest_default.jpeg"))
        }, event.threadID, event.messageID);
    }

    const maxImages = 10;
    if (numImages > maxImages) {
        numImages = maxImages;
        api.sendMessage(`✨ Hình ảnh tối đa có thể tìm là ${maxImages} ảnh để đảm bảo tốc độ và hiệu suất cho bot! Đã tự động điều chỉnh về ${maxImages} ảnh. 💖`, event.threadID, event.messageID); // Icon lấp lánh, trái tim
    }
    if (numImages <= 0) {
        numImages = 1;
        api.sendMessage("🤔 Số ảnh cần tìm phải lớn hơn 0. Đã tự động điều chỉnh về 1 ảnh.", event.threadID, event.messageID); // Icon suy nghĩ
    }

    try {
        api.sendMessage(`🔍 Đang tìm kiếm hình ảnh cho từ khóa: "${query}" với số lượng ${numImages} ảnh... Vui lòng chờ nhé! ✨`, event.threadID, event.messageID); // Icon kính lúp, lấp lánh

        const res = await axios.get(`https://api.sumiproject.net/pinterest?search=${encodeURIComponent(query)}`);
        const data = res.data.data;

        if (!data || data.length === 0) {
            return api.sendMessage(`😔 Không tìm thấy hình ảnh nào cho từ khóa "${query}". Vui lòng thử lại với từ khóa khác!`, event.threadID, event.messageID); // Icon mặt buồn
        }

        let imgData = [];
        let downloadedCount = 0;

        for (let i = 0; i < Math.min(numImages, data.length); i++) {
            const imageUrl = data[i];
            const imagePath = path.join(dirCache, `${event.senderID}_${Date.now()}_${i + 1}.jpg`);

            try {
                const getDown = (await axios.get(imageUrl, { responseType: 'arraybuffer' })).data;
                fs.writeFileSync(imagePath, Buffer.from(getDown, 'utf-8'));
                imgData.push(fs.createReadStream(imagePath));
                downloadedCount++;
            } catch (downloadError) {
                console.error(`Lỗi khi tải ảnh ${imageUrl}:`, downloadError);
            }
        }

        if (imgData.length === 0) {
            return api.sendMessage(`😢 Không thể tải được bất kỳ ảnh nào cho từ khóa "${query}". Có thể các liên kết ảnh bị hỏng.`, event.threadID, event.messageID); // Icon mặt khóc
        }

        await api.sendMessage({
            attachment: imgData,
            body: `✨ ==== [ PINTEREST ] ==== ✨\n──────────────────\n\n` + // Tiêu đề với icon
                  `👉 Kết quả tìm kiếm của từ khóa: ${query}\n` + // Icon mũi tên
                  `🖼️ Tổng số ảnh tìm thành công: ${downloadedCount} ảnh 💖` + // Icon khung ảnh, trái tim
                  (downloadedCount < numImages && downloadedCount > 0 ? `\n\n💡 Lưu ý: Bot chỉ tìm được ${downloadedCount} ảnh thực tế từ API.` : '') // Icon bóng đèn
        }, event.threadID, event.messageID);

    } catch (error) {
        console.error("Lỗi khi gọi API Pinterest:", error);
        api.sendMessage(`❌ Đã xảy ra lỗi khi tìm kiếm hình ảnh. Vui lòng thử lại sau hoặc kiểm tra từ khóa! Lỗi: ${error.message}`, event.threadID, event.messageID); // Icon dấu X
    } finally {
        const filesInCache = await fs.readdir(dirCache);
        for (const file of filesInCache) {
            if (file.startsWith(`${event.senderID}_`)) {
                await fs.unlink(path.join(dirCache, file));
            }
        }
    }
};