const axios = require("axios");
const fs = require("fs-nextra");
const path = require("path");

module.exports.config = {
    name: "ảnh",
    version: "1.0.3", // ⬆️ Nâng version lên lần nữa vì đã gỡ bỏ từ khóa
    hasPermssion: 0,
    credits: "modded by qh and Gemini ✨",
    description: "🖼️ nhận ảnh theo nhiều chủ đề khác nhau siêu hấp dẫn! 🤩",
    commandCategory: "giải trí 🎨",
    usages: "[keyword]",
    cooldowns: 7
};

const API_CONFIG = {
    API_URL1: "https://imgs-api.vercel.app/",
    API_URL2: "https://api.sumiproject.net/images/",
    API_KEY: "mk001"
};

const KEYWORDS = {
    "anime": "ảnh anime 🍥",
    "6mui": "ảnh 6 múi (fitness) 💪",
    "girl": "ảnh gái xinh 👧",
    "capdoi": "ảnh cặp đôi 💑",
    "gainhat": "ảnh gái nhật 🌸",
    "hana": "ảnh hana 🌷",
    "ausand": "ảnh ausand 🌟",
    "jimmy": "ảnh jimmy 🕺",
    "jack": "ảnh jack 🎧",
    "khanhuyen": "ảnh khánh huyền ✨",
    "lebong": "ảnh lê bống 💃",
    "linhngocdam": "ảnh linh ngọc đàm 🎤",
    "ngoctrinh": "ảnh ngọc trinh 👑",
    // "naughty": "ảnh naughty 😈", // 🚫 Đã xóa theo yêu cầu
    "japcosplay": "ảnh japan cosplay 🎎",
    "loli": "ảnh loli 🍭",
    "caidloli": "ảnh caidloli 🍬",
    "tw": "ảnh gái trung quốc 🇨🇳",
    // "nsfw": "ảnh nsfw 🔞", // 🚫 Đã xóa theo yêu cầu
    "aqua": "ảnh aqua 💧",
    "chitanda": "ảnh chitanda 🧐",
    "kana": "ảnh kana 🌸",
    "kurumi": "ảnh kurumi ⏳",
    "lucy": "ảnh lucy 💫",
    "mirai": "ảnh mirai 🚀",
    "rem": "ảnh rem 💙",
    "sagiri": "ảnh sagiri ✍️",
    "umaru": "ảnh umaru 🐹",
    "rushia": "ảnh rushia 💚"
};

const API2_KEYWORDS = ["anime", "6mui"];

module.exports.run = async ({ api, event, args }) => {
    const { threadID, messageID } = event;
    const keywordInput = args[0] ? args[0].toLowerCase() : null;
    const cacheDir = path.resolve(__dirname, "cache");

    if (!await fs.exists(cacheDir)) {
        await fs.mkdir(cacheDir);
    }

    if (!keywordInput) {
        let menu = "✨===== 『 MENU ẢNH 』 =====✨\n";
        menu += "🎨 Bạn muốn xem ảnh chủ đề gì? Hãy chọn một từ khóa dưới đây nha:\n";
        menu += "━━━━━━━━━━━━━━━━━\n";
        for (const [key, description] of Object.entries(KEYWORDS)) {
            menu += `➢ ${key.toLowerCase()}: ${description}\n`;
        }
        menu += "━━━━━━━━━━━━━━━━━\n";
        menu += "💡 Cách dùng: `ảnh [từ khóa]`\n";
        menu += "💖 Ví dụ: `ảnh girl` để xem gái xinh! 😉";

        return api.sendMessage(menu, threadID, messageID);
    }

    if (!KEYWORDS[keywordInput]) {
        return api.sendMessage(`🚫 Từ khóa "${keywordInput}" không hợp lệ. Vui lòng nhập \`ảnh\` để xem danh sách từ khóa hợp lệ nha! 🤦‍♀️`, threadID, messageID);
    }

    api.sendMessage(`⏳ Đang tìm ảnh cho từ khóa "${KEYWORDS[keywordInput]}"... Vui lòng chờ chút nhé! ✨`, threadID, messageID);

    try {
        const isAPI2 = API2_KEYWORDS.includes(keywordInput);
        const requestURL = isAPI2 ? `${API_CONFIG.API_URL2}${keywordInput}` : `${API_CONFIG.API_URL1}${keywordInput}?apikey=${API_CONFIG.API_KEY}`;

        const response = await axios.get(requestURL);
        const { url, author } = response.data;

        if (!url) {
            return api.sendMessage("❌ Không thể lấy được link ảnh từ API. Có thể API đang gặp sự cố. Vui lòng thử lại sau! 😥", threadID, messageID);
        }

        const ext = path.extname(url) || '.jpg';
        const filePath = path.resolve(cacheDir, `${keywordInput}_${Date.now()}${ext}`);

        const imageResponse = await axios({
            url: url,
            method: "GET",
            responseType: "stream"
        });

        await new Promise((resolve, reject) => {
            imageResponse.data.pipe(fs.createWriteStream(filePath))
                .on('finish', resolve)
                .on('error', reject);
        });

        let messageBody = `🖼️ Ảnh cho từ khóa: ${KEYWORDS[keywordInput]}\n`;
        if (!isAPI2 && author) {
            messageBody += `📝 Tác giả: ${author}\n`;
        }
        messageBody += `━━━━━━━━━━━━━━━━━`;

        return api.sendMessage({
            body: messageBody,
            attachment: fs.createReadStream(filePath)
        }, threadID, () => {
            fs.unlink(filePath).catch(err => console.error("❌ Lỗi khi xóa file cache:", err));
        }, messageID);

    } catch (error) {
        console.error("❌ Lỗi xảy ra khi xử lý lệnh ảnh:", error);
        let errorMessage = "❌ Ối kìa! Có vẻ đã xảy ra lỗi khi lấy ảnh rồi. 🥲";
        if (error.response) {
            if (error.response.status === 404) {
                errorMessage += "\n💡 Không tìm thấy ảnh với từ khóa này. Hãy thử lại sau hoặc dùng từ khóa khác nha!";
            } else if (error.response.status === 403 || error.response.status === 401) {
                errorMessage += "\n🔑 Lỗi API Key hoặc không có quyền truy cập API. Vui lòng kiểm tra lại API Key nhé! 🧐";
            } else {
                 errorMessage += `\n🌐 Lỗi từ API: ${error.response.status}. Có thể API đang gặp sự cố. Vui lòng thử lại! 🚦`;
            }
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
            errorMessage += "\n🌐 Lỗi kết nối mạng hoặc API phản hồi chậm/không tồn tại. Vui lòng thử lại!";
        } else {
             errorMessage += `\n❓ Lỗi không xác định: ${error.message}.`;
        }
        api.sendMessage(errorMessage, threadID, messageID);
    }
};