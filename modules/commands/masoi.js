module.exports.config = {
    name: "masoi",
    version: "1.0.1", // Nâng version lên xíu ⬆️
    hasPermssion: 0,
    credits: "D-Jukie convert Kb2aBot, modded by qh and Gemini ✨", // Giữ nguyên credits gốc và thêm tên chúng ta
    description: "một chiếc ma sói trên mirai 🐺🌙", // Chữ thường, viết hoa đầu dòng + icon
    commandCategory: "trò chơi 🎮", // Chữ thường, viết hoa đầu dòng + icon
    usages: "masoi [tùy chọn]", // Thêm "[tùy chọn]" để gợi ý có thể có thêm args
    cooldowns: 0
};

module.exports.onLoad = async () => {
    try {
        const GameManager = require('./masoi/GameManager'); // Đảm bảo đường dẫn này đúng
        const loader = () => {
            var exportData = {};
            exportData['Ma Sói'] = require('./masoi/index'); // Tên key nên khớp với game.name trong GameManager
            return exportData;
        };
        var gameManager = new GameManager(loader());
        global.gameManager = gameManager;
        console.log("🐺🌙 Đã tải game Ma Sói thành công! Sẵn sàng chơi!"); // Thêm thông báo khi load
    } catch (e) {
        console.error("❌ Đã xảy ra lỗi khi tải game Ma Sói:", e); // Viết hoa đầu dòng + icon
    }
};

module.exports.handleEvent = async function({ api, event }) {
    // Rút gọn hàm reply và đảm bảo tin nhắn theo format mới
    const reply = function(message) {
        // Tự động viết hoa chữ cái đầu tiên của mỗi dòng nếu nó không phải là một chuỗi đặc biệt (ví dụ: markdown)
        const formatMessage = message.split('\n').map(line => {
            if (line.trim().length === 0 || line.startsWith('[') || line.startsWith('`')) return line; // Giữ nguyên dòng trống hoặc markdown
            return line.charAt(0).toUpperCase() + line.slice(1);
        }).join('\n');
        return api.sendMessage(formatMessage, event.threadID, event.messageID);
    };

    if (!global.gameManager || !global.gameManager.items.some(i => i.name === "Ma Sói")) return;

    for (const game of global.gameManager.items) {
        // Kiểm tra xem game có thuộc threadID hoặc participantID hợp lệ không
        if (!game.threadID || !game.participants) continue; // Đảm bảo thuộc tính tồn tại

        // Nếu là tin nhắn từ người chơi trong game (trong private chat) hoặc trong thread của game
        if ((game.participants.includes(event.senderID) && !event.isGroup) || game.threadID === event.threadID) {
            game.onMessage(event, reply);
        }
    }
};

module.exports.run = async ({ event, args, Users, api }) => { // Thêm api vào destructuring nếu cần dùng trong GameManager
    global.Users = Users; // Gán Users vào global để GameManager có thể truy cập

    // Kiểm tra xem game đã được load chưa
    if (!global.gameManager) {
        return api.sendMessage("❌ Lệnh Ma Sói chưa được tải. Vui lòng thử lại sau hoặc báo admin để kiểm tra console bot nhé! 😟", event.threadID, event.messageID); // Viết hoa đầu dòng + icon
    }

    global.gameManager.run(this.config.name, { // Dùng this.config.name để lấy tên lệnh "masoi"
        masterID: event.senderID,
        threadID: event.threadID,
        param: args,
        isGroup: event.isGroup,
        // Có thể truyền thêm api vào đây nếu các module con cần dùng api trực tiếp
        // api: api 
    });
};