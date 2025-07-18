const axios = require('axios');
const fs = require('fs-extra'); // Sử dụng fs-extra

const DATA_DIR = __dirname + '/cache/data';
const DATA_PATH = DATA_DIR + '/simData.json'; // Đổi tên file để tránh trùng lặp nếu có

// Đảm bảo thư mục tồn tại
fs.ensureDirSync(DATA_DIR);

let simData = {};

// Khởi tạo hoặc đọc dữ liệu
if (fs.existsSync(DATA_PATH)) {
    simData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
} else {
    fs.writeFileSync(DATA_PATH, JSON.stringify({}), 'utf-8'); // Ghi file rỗng nếu chưa có
}

// Hàm lưu dữ liệu
const saveData = () => {
    fs.writeFileSync(DATA_PATH, JSON.stringify(simData, null, 4), 'utf-8'); // Định dạng JSON cho dễ đọc
};

module.exports = {
    config: {
        name: "sim",
        version: "1.1.0", // Nâng version lên
        hasPermission: 0,
        credits: "L.V. Bằng (Modded by qh và Gemini) 👑", // Thêm credit của mày và tao
        description: "💬 Kích hoạt hoặc tắt chức năng chat tự động với SimSimi",
        commandCategory: "AI", // Chuyển sang AI cho chuẩn
        usages: "", // Không cần usages vì là toggle lệnh
        cooldowns: 1,
    },

    run: ({ event, api }) => {
        const threadID = event.threadID;
        simData[threadID] = !simData[threadID]; // Đảo trạng thái: true <-> false

        saveData();
        const status = simData[threadID] ? 'BẬT' : 'TẮT';
        api.sendMessage(`✅ Chức năng SimSimi đã được ${status} thành công trong nhóm này! ✨`, threadID);
    },

    sim: async function(text) {
        const url = 'https://api.simsimi.vn/v1/simtalk';
        const postData = `text=${encodeURIComponent(text)}&lc=vn`; // Mã hóa text để tránh lỗi
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        };
        try {
            const response = await axios.post(url, postData, { headers });
            const message = response.data.message;
            if (message && message.includes("Tôi không biết làm thế nào để trả lời. Dạy tôi câu trả lời")) {
                return "Hmmm... Có vẻ kiến thức của tôi về điều này còn hạn chế. Bạn có thể dạy thêm cho tôi không? 🤖";
            }
            return message || null; // Trả về null nếu không có message
        } catch (err) {
            console.error("❌ Lỗi khi gọi API SimSimi:", err.response ? err.response.data : err.message);
            return "Xin lỗi, hiện tại tôi không thể trả lời. Có vẻ SimSimi đang hơi 'dỗi' rồi! 😅";
        }
    },

    handleEvent: async function({ event, api }) {
        const { threadID, senderID, body, messageReply } = event;

        // Không xử lý tin nhắn của chính bot
        if (senderID === api.getCurrentUserID()) return;

        // Chỉ xử lý nếu SimSimi được bật cho nhóm này
        if (!simData[threadID]) return;

        // Điều kiện để bot trả lời:
        // 1. Tin nhắn là reply của người khác (không phải của bot)
        // 2. Hoặc tin nhắn chứa từ "bot" (không phân biệt hoa thường) và không phải là reply
        const shouldReply = (messageReply && messageReply.senderID !== api.getCurrentUserID()) || 
                            (body && body.toLowerCase().includes('bot') && !messageReply);

        if (shouldReply) {
            const textToSim = messageReply ? messageReply.body : body; // Lấy nội dung từ reply hoặc body
            if (!textToSim || textToSim.trim().length === 0) return; // Không trả lời tin nhắn rỗng

            const answer = await this.sim(textToSim);

            api.sendMessage({
                body: answer || "Xin lỗi, tôi không thể tìm thấy câu trả lời lúc này. 🤷‍♀️"
            }, threadID, event.messageID); // Reply thẳng vào tin nhắn gốc
        }
    },

    handleReply: async function({ event, api, handleReply }) {
        const { threadID, senderID, body } = event;
        const { messageID: replyMessageID, author: repliedAuthor } = handleReply;

        // Chỉ xử lý nếu người reply là người đã được bot reply trước đó
        if (senderID !== repliedAuthor) return;

        // Chỉ xử lý nếu SimSimi được bật cho nhóm này (đảm bảo consistency)
        if (!simData[threadID]) return;

        if (!body || body.trim().length === 0) return; // Không xử lý reply rỗng

        const answer = await this.sim(body);

        api.sendMessage({
            body: answer || "Tôi vẫn đang cố gắng tìm câu trả lời đây... Đợi chút nhé! 🤔"
        }, threadID, event.messageID); // Reply thẳng vào tin nhắn reply của người dùng
    }
};