const fs = require('fs-extra'); // Dùng fs-extra cho tiện
const path = require('path');
const axios = require('axios');
const moment = require("moment-timezone");

module.exports.config = {
    name: "shortcut",
    version: "2.0.0", // Phiên bản hợp nhất và nâng cấp bởi qh và Gemini
    hasPermssion: 0,
    credits: "Niiozic (mod by qh và Gemini) 👑", // Thêm credit của mày và tao
    description: "⚡ Tạo phím tắt cho tin nhắn, hỗ trợ tag, auto-send, welcome/goodbye và nhiều biến động!", // Mô tả rõ ràng, hấp dẫn hơn
    commandCategory: "TIỆN ÍCH", // Chuyển sang tiện ích
    usages: "[add/del/list/tag/join/leave/autosend/empty]\nCác biến hỗ trợ:\n{time} -> Thời gian hiện tại\n{name} -> Tên người tương tác\n{nameThread} -> Tên nhóm chat\n{soThanhVien} -> Số thành viên trong nhóm\n{link} -> Link Facebook người tương tác\n{authorName} -> Tên người add/kick/thực hiện lệnh\n{authorId} -> Link Facebook người add/kick/thực hiện lệnh\n{trangThai} -> Tự out hay bị kick (khi out)\n{qtv} -> Tag tất cả QTV nhóm",
    cooldowns: 0,
    dependencies: {
        "fs-extra": "",
        "path": "",
        "axios": "",
        "moment-timezone": ""
    }
};

// Hàm định dạng phần mở rộng file đính kèm
const format_attachment = type => ({
    photo: 'png', video: 'mp4', audio: 'mp3', animated_image: 'gif',
})[type] || 'bin';

// Hàm stream URL về attachment
const stream_url = async (url) => {
    try {
        const response = await axios.get(url, { responseType: 'stream' });
        return response.data;
    } catch (e) {
        console.error("⚠️ Lỗi khi stream URL:", e);
        return null;
    }
};

// Đường dẫn file lưu data shortcut (trong thư mục data của commands)
const DATA_PATH = path.resolve(__dirname, '..', 'commands', 'data', "shortcutdata.json");

module.exports.onLoad = function({ api }) {
    if (!global.moduleData.shortcut) {
        global.moduleData.shortcut = new Map();
    }

    // Đảm bảo thư mục data tồn tại
    fs.ensureDirSync(path.dirname(DATA_PATH));

    // Khởi tạo file data nếu chưa có
    if (!fs.existsSync(DATA_PATH)) {
        fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 4), "utf-8");
    }

    // Load data từ file vào global.moduleData.shortcut
    const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
    for (const threadData of data) {
        global.moduleData.shortcut.set(threadData.threadID, threadData.shortcuts);
    }

    // Interval cho auto-send (chỉ chạy một lần duy nhất)
    if (!global.shortcutAutoSendInterval) {
        global.shortcutAutoSendInterval = setInterval(async function () {
            const now = moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss');
            for (let [threadID, thread_data] of global.moduleData.shortcut) {
                for (let e of thread_data) {
                    if (e.input_type === 'autosend') {
                        if (e.hours === now) {
                            try {
                                const outputs = e.output.split('|'); // Hỗ trợ nhiều output ngăn cách bởi |
                                const output = outputs[Math.random() * outputs.length << 0]; // Chọn ngẫu nhiên
                                let msg = { body: output };

                                if (e.uri && e.uri !== 's') { // 's' nghĩa là không có attachment
                                    if (e.uri === 'random') {
                                        // Cần một API link ngẫu nhiên ở đây nếu có
                                        // Tạm thời bỏ qua nếu không có API cung cấp
                                        console.warn("⚠️ [Shortcut] Auto-send với 'random' attachment yêu cầu API link. Vui lòng cấu hình.");
                                    } else if (/^https:\/\//.test(e.uri)) {
                                        const attachmentStream = await stream_url(e.uri);
                                        if (attachmentStream) {
                                            msg.attachment = [attachmentStream];
                                        }
                                    }
                                }
                                api.sendMessage(msg, threadID);
                            } catch (error) {
                                console.error(`❌ [Shortcut] Lỗi khi xử lý auto-send cho nhóm ${threadID}:`, error);
                            }
                        }
                    }
                }
            }
        }, 1000); // Kiểm tra mỗi giây
    }
};

module.exports.handleEvent = async function({ event, api, Users }) {
    const { threadID, messageID, body, senderID, mentions: Mentions = {}, logMessageType, logMessageData, participantIDs, author } = event;
    
    // Bỏ qua tin nhắn của chính bot để tránh loop
    if (api.getCurrentUserID() === senderID) return;

    if (!global.moduleData.shortcut || !global.moduleData.shortcut.has(threadID)) return;

    const data = global.moduleData.shortcut.get(threadID);

    // Xử lý các event log (join/leave)
    if (logMessageType === 'log:subscribe' || logMessageType === 'log:unsubscribe') {
        const type = (logMessageType === 'log:subscribe') ? 'join' : 'leave';
        const shortcutEvent = data.find(e => e.input_type === type);

        if (!shortcutEvent) return;

        try {
            const thread_info = await api.getThreadInfo(threadID);
            const admins = thread_info.adminIDs.map(e => ({ id: e.id, name: global.data.userName.get(e.id) || "Admin" }));

            let outputText = shortcutEvent.output
                .replace(/{nameThread}/g, thread_info.threadName || "nhóm này")
                .replace(/{soThanhVien}/g, thread_info.participantIDs?.length || 0)
                .replace(/{time}/g, moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss | DD/MM/YYYY'));
            
            let mentions = [];
            let authorName = global.data.userName.get(author) || "Một thành viên";
            let authorId = `https://www.facebook.com/profile.php?id=${author}`;

            if (type === 'join') {
                const addedParticipants = logMessageData.addedParticipants || [];
                const participantNames = addedParticipants.map(e => e.fullName).join(', ');
                const participantLinks = addedParticipants.map(e => `https://www.facebook.com/profile.php?id=${e.userFbId}`).join('\n');
                
                outputText = outputText
                    .replace(/{name}/g, participantNames)
                    .replace(/{link}/g, participantLinks);
                
                addedParticipants.forEach(e => mentions.push({ id: e.userFbId, tag: e.fullName }));

            } else { // type === 'leave'
                const leftParticipantName = global.data.userName.get(logMessageData.leftParticipantFbId) || "một người dùng";
                const leftParticipantLink = `https://www.facebook.com/profile.php?id=${logMessageData.leftParticipantFbId}`;
                const trangThai = (logMessageData.leftParticipantFbId == author) ? `đã tự out khỏi nhóm` : `đã bị kick khỏi nhóm`;
                
                outputText = outputText
                    .replace(/{name}/g, leftParticipantName)
                    .replace(/{link}/g, leftParticipantLink)
                    .replace(/{trangThai}/g, trangThai);

                mentions.push({ id: logMessageData.leftParticipantFbId, tag: leftParticipantName });
            }

            outputText = outputText
                .replace(/{authorName}/g, authorName)
                .replace(/{authorId}/g, authorId);
            
            if (/{qtv}/g.test(outputText)) {
                const qtvTags = admins.map(admin => `@${admin.name}`).join('\n');
                outputText = outputText.replace(/{qtv}/g, qtvTags);
                admins.forEach(admin => mentions.push({ id: admin.id, tag: admin.name }));
            }

            let msg = { body: outputText, mentions: mentions.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i) }; // Lọc trùng lặp mentions

            if (shortcutEvent.uri && shortcutEvent.uri !== 's') {
                if (shortcutEvent.uri === 'random') {
                    // Cần một API link ngẫu nhiên ở đây nếu có
                    console.warn("⚠️ [Shortcut] Event join/leave với 'random' attachment yêu cầu API link. Vui lòng cấu hình.");
                } else if (/^https:\/\//.test(shortcutEvent.uri)) {
                    const attachmentStream = await stream_url(shortcutEvent.uri);
                    if (attachmentStream) {
                        msg.attachment = [attachmentStream];
                    }
                }
            }
            api.sendMessage(msg, threadID);

        } catch (error) {
            console.error(`❌ [Shortcut] Lỗi xử lý event ${type} cho nhóm ${threadID}:`, error);
        }
        return; // Đã xử lý event log, không cần kiểm tra tin nhắn thường
    }

    // Xử lý tin nhắn thường và tag
    if (!body) return;

    // Lọc bỏ các shortcut không phải là text/tag (ví dụ: autosend, join, leave)
    const filteredData = data.filter(item => !['autosend', 'join', 'leave'].includes(item.input_type));

    let dataThread;
    const lowerCaseBody = body.toLowerCase();
    const mentionIDs = Object.keys(Mentions);

    if (mentionIDs.length > 0) {
        dataThread = filteredData.find(item => typeof item.tag_id === 'string' && mentionIDs.includes(item.tag_id));
    }
    
    if (!dataThread) {
        dataThread = filteredData.find(item => (item.input || '').toLowerCase() === lowerCaseBody);
    }
    
    if (dataThread) {
        try {
            let output = dataThread.output;
            const userName = global.data.userName.get(senderID) || await Users.getNameUser(senderID);
            const currentTime = moment().tz("Asia/Ho_Chi_Minh").format('HH:mm:ss | DD/MM/YYYY');

            if (output) {
                output = output
                    .replace(/\{name}/g, userName)
                    .replace(/\{time}/g, currentTime);
            }

            let msg = { body: output };

            if (dataThread.uri && dataThread.uri !== 's') {
                if (dataThread.uri === 'random') {
                     // Cần một API link ngẫu nhiên ở đây nếu có
                    console.warn("⚠️ [Shortcut] Phản hồi tin nhắn với 'random' attachment yêu cầu API link. Vui lòng cấu hình.");
                } else if (/^https:\/\//.test(dataThread.uri)) {
                    const attachmentStream = await stream_url(dataThread.uri);
                    if (attachmentStream) {
                        msg.attachment = [attachmentStream];
                    }
                }
            }
            return api.sendMessage(msg, threadID, messageID);
        } catch (error) {
            console.error("❌ [Shortcut] Lỗi khi xử lý phản hồi shortcut:", error);
            api.sendMessage("🚨 Đã xảy ra lỗi khi bot cố gắng phản hồi shortcut này. Vui lòng thử lại!", threadID, messageID);
        }
    }
};

module.exports.handleReply = async function({ event = {}, api, handleReply }) {
    if (handleReply.author !== event.senderID) return; // Chỉ người khởi tạo mới có thể reply

    try {
        const { threadID, messageID, senderID, body, attachments = [] } = event;
        const name = this.config.name;

        // Đảm bảo file data tồn tại và đọc dữ liệu
        const readData = fs.readFileSync(DATA_PATH, "utf-8");
        let data = JSON.parse(readData);
        let threadData = data.find(item => item.threadID === threadID) || { threadID, shortcuts: [] };
        let globalShortcutData = global.moduleData.shortcut.get(threadID) || [];

        api.unsendMessage(handleReply.messageID); // Xóa tin nhắn handleReply cũ

        switch (handleReply.type) {
            case "requireInput": {
                if (!body || body.trim().length === 0) {
                    return api.sendMessage("⚠️ Từ khóa không được để trống!", threadID, messageID);
                }
                if (threadData.shortcuts.some(item => item.input && item.input.toLowerCase() === body.toLowerCase())) {
                    return api.sendMessage("❎ Từ khóa này đã tồn tại trong nhóm rồi!", threadID, messageID);
                }
                api.sendMessage("📌 Tuyệt! Giờ hãy reply tin nhắn này với **câu trả lời** bạn muốn bot phản hồi khi từ khóa được dùng:", threadID, (error, info) => {
                    global.client.handleReply.push({
                        type: "requireOutput",
                        name,
                        author: senderID,
                        messageID: info.messageID,
                        input: body.trim(),
                        input_type: 'text' // Xác định đây là shortcut dạng text
                    });
                }, messageID);
                break;
            }
            case "requireOutput": {
                if (!body || body.trim().length === 0) {
                    return api.sendMessage("⚠️ Câu trả lời không được để trống!", threadID, messageID);
                }
                api.sendMessage(`📌 Gần xong rồi! Giờ reply tin nhắn này với **tệp đính kèm** (ảnh/video/mp3/gif) hoặc:\n- Nhập **'s'** nếu không cần tệp.\n- Nhập **'random'** nếu muốn sử dụng ảnh/video ngẫu nhiên từ API (nếu có cấu hình).`, threadID, (error, info) => {
                    global.client.handleReply.push({
                        type: "requireAttachment", // Đổi tên case cho rõ ràng hơn
                        name,
                        author: senderID,
                        messageID: info.messageID,
                        input: handleReply.input,
                        output: body,
                        input_type: handleReply.input_type,
                        tag_id: handleReply.tag_id,
                        hours: handleReply.hours // Giữ lại cho autosend
                    });
                }, messageID);
                break;
            }
            case "requireAttachment": { // Case mới cho việc yêu cầu file đính kèm
                let uri = '';
                if (body.toLowerCase() === 's') {
                    uri = 's'; // Người dùng chọn không có attachment
                } else if (body.toLowerCase() === 'random') {
                    uri = 'random'; // Người dùng chọn attachment ngẫu nhiên
                } else if (attachments.length === 0) {
                    return api.sendMessage('⚠️ Bạn chưa cung cấp tệp đính kèm hoặc lựa chọn hợp lệ ("s" / "random")!', threadID, messageID);
                } else {
                    const attachment = attachments[0];
                    const fileExtension = format_attachment(attachment.type);
                    try {
                        uri = await uploadToCatbox(attachment.url, fileExtension); // Upload lên Catbox
                        if (!uri) {
                            return api.sendMessage('❌ Không thể upload tệp đính kèm lên server! Vui lòng thử lại hoặc chọn "s".', threadID, messageID);
                        }
                    } catch (e) {
                        console.error("❌ Lỗi khi upload tệp đính kèm:", e);
                        return api.sendMessage('❌ Đã xảy ra lỗi khi upload tệp đính kèm! Vui lòng thử lại hoặc chọn "s".', threadID, messageID);
                    }
                }

                const newShortcut = {
                    input: handleReply.input,
                    output: handleReply.output,
                    uri: uri === 's' ? null : uri, // Lưu null nếu người dùng chọn 's'
                    input_type: handleReply.input_type,
                    tag_id: handleReply.tag_id,
                    hours: handleReply.hours // Dành cho autosend
                };

                // Kiểm tra và loại bỏ shortcut cũ nếu đang cập nhật
                if (handleReply.input_type === 'join' || handleReply.input_type === 'leave' || handleReply.input_type === 'autosend') {
                    threadData.shortcuts = threadData.shortcuts.filter(
                        s => s.input_type !== handleReply.input_type || (s.input_type === 'autosend' && s.hours !== handleReply.hours)
                    );
                    globalShortcutData = globalShortcutData.filter(
                        s => s.input_type !== handleReply.input_type || (s.input_type === 'autosend' && s.hours !== handleReply.hours)
                    );
                }

                threadData.shortcuts.push(newShortcut);
                globalShortcutData.push(newShortcut);

                if (!data.some(item => item.threadID === threadID)) {
                    data.push(threadData);
                } else {
                    const index = data.findIndex(item => item.threadID === threadID);
                    data[index] = threadData;
                }

                global.moduleData.shortcut.set(threadID, globalShortcutData);
                fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), "utf-8");

                let successMsg = `✅ Đã thêm thành công shortcut mới! ✨\n\n`;
                successMsg += `- **Loại:** ${newShortcut.input_type || 'text'}\n`;
                if (newShortcut.input) successMsg += `- **Từ khóa:** ${newShortcut.input}\n`;
                if (newShortcut.tag_id) successMsg += `- **Tag ID:** ${newShortcut.tag_id} (${global.data.userName.get(newShortcut.tag_id) || 'Không rõ tên'})\n`;
                if (newShortcut.hours) successMsg += `- **Giờ gửi tự động:** ${newShortcut.hours}\n`;
                successMsg += `- **Phản hồi:** ${newShortcut.output}\n`;
                successMsg += `- **Đính kèm:** ${newShortcut.uri ? (newShortcut.uri === 'random' ? 'Ngẫu nhiên từ API' : 'Có') : 'Không'}`;

                return api.sendMessage(successMsg, threadID, messageID);
            }
            case "delShortcut": {
                const inputNumbers = event.args.map(Number).filter(n => Number.isInteger(n) && n > 0);
                if (inputNumbers.length === 0) {
                    return api.sendMessage("⚠️ Vui lòng nhập số thứ tự của shortcut bạn muốn xóa!", threadID, messageID);
                }

                let deletedItemsInfo = [];
                let shortcutsToKeep = [];
                let originalShortcuts = [...globalShortcutData]; // Tạo bản sao để tránh thay đổi khi lặp

                for (let i = 0; i < originalShortcuts.length; i++) {
                    if (inputNumbers.includes(i + 1)) { // So sánh với STT mà người dùng nhập
                        const deletedItem = originalShortcuts[i];
                        if (deletedItem) {
                            let displayName = '';
                            if (deletedItem.input_type === 'tag') {
                                displayName = `@${global.data.userName.get(deletedItem.tag_id) || deletedItem.tag_id}`;
                            } else if (deletedItem.input_type === 'autosend') {
                                displayName = `Tự động gửi lúc ${deletedItem.hours}`;
                            } else if (deletedItem.input_type === 'join') {
                                displayName = `Tin nhắn chào thành viên mới`;
                            } else if (deletedItem.input_type === 'leave') {
                                displayName = `Tin nhắn tạm biệt thành viên`;
                            } else {
                                displayName = deletedItem.input;
                            }
                            deletedItemsInfo.push(`${i + 1}. **${displayName}**`);
                        }
                    } else {
                        shortcutsToKeep.push(originalShortcuts[i]);
                    }
                }

                if (deletedItemsInfo.length === 0) {
                    return api.sendMessage("⚠️ Không tìm thấy shortcut nào với số thứ tự đã nhập để xóa.", threadID, messageID);
                }

                threadData.shortcuts = shortcutsToKeep;
                global.moduleData.shortcut.set(threadID, shortcutsToKeep);

                // Cập nhật lại file data.json
                const dataIndex = data.findIndex(item => item.threadID === threadID);
                if (dataIndex !== -1) {
                    data[dataIndex] = threadData;
                } else {
                    // Nếu vì lý do nào đó không tìm thấy threadID, có thể thêm vào hoặc bỏ qua
                    // Trong trường hợp này, ta giả định luôn tìm thấy nếu có shortcut trong thread đó
                }
                fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4));

                return api.sendMessage(`✅ Đã xóa thành công các shortcut sau:\n\n${deletedItemsInfo.join('\n')}`, threadID);
            }
            // Các case handleReply khác có thể được thêm vào đây
        }
    } catch (e) {
        console.error("❌ [Shortcut] Lỗi trong handleReply:", e);
        api.sendMessage("🚨 Đã xảy ra lỗi hệ thống khi xử lý phản hồi. Vui lòng thử lại!", threadID, messageID);
    }
};

module.exports.run = async function({ event, api, args }) {
    try {
        const { threadID, messageID, senderID, mentions = {} } = event;
        const command = args[0] ? args[0].toLowerCase() : '';
        const name = this.config.name;

        // Đảm bảo thư mục data và file data.json tồn tại
        fs.ensureDirSync(path.dirname(DATA_PATH));
        if (!fs.existsSync(DATA_PATH)) {
            fs.writeFileSync(DATA_PATH, JSON.stringify([], null, 4), "utf-8");
        }

        let data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
        let threadData = data.find(item => item.threadID === threadID) || { threadID, shortcuts: [] };
        
        switch (command) {
            case "add":
            case "-a": {
                return api.sendMessage("📌 Reply tin nhắn này để nhập **từ khóa** cho shortcut mới của bạn:", threadID, (error, info) => {
                    global.client.handleReply.push({
                        type: "requireInput",
                        name,
                        author: senderID,
                        messageID: info.messageID
                    });
                }, messageID);
            }
            case "remove":
            case "delete":
            case "del":
            case "-d": {
                const shortcutsInThread = global.moduleData.shortcut.get(threadID);
                if (!shortcutsInThread || shortcutsInThread.length === 0) {
                    return api.sendMessage("❎ Nhóm của bạn hiện chưa có shortcut nào để xóa.", threadID, messageID);
                }
                
                let listMsg = "📝 Dưới đây là danh sách các shortcut hiện có:\n\n";
                shortcutsInThread.forEach((shortcut, index) => {
                    let displayName = '';
                    if (shortcut.input_type === 'tag') {
                        displayName = `TAG: @${global.data.userName.get(shortcut.tag_id) || shortcut.tag_id}`;
                    } else if (shortcut.input_type === 'autosend') {
                        displayName = `AUTO-SEND: ${shortcut.hours}`;
                    } else if (shortcut.input_type === 'join') {
                        displayName = `WELCOME`;
                    } else if (shortcut.input_type === 'leave') {
                        displayName = `GOODBYE`;
                    } else {
                        displayName = `TỪ KHÓA: ${shortcut.input}`;
                    }
                    listMsg += `${index + 1}. ${displayName} -> "${shortcut.output}"\n`;
                });
                listMsg += `\n**Reply tin nhắn này** với số thứ tự của shortcut bạn muốn xóa (có thể xóa nhiều bằng cách cách nhau bởi dấu cách).`;
                
                return api.sendMessage(listMsg, threadID, (error, info) => {
                    global.client.handleReply.push({
                        type: "delShortcut",
                        name,
                        author: senderID,
                        messageID: info.messageID
                    });
                }, messageID);
            }
            case "list":
            case "all":
            case "-l": {
                const shortcutsInThread = global.moduleData.shortcut.get(threadID);
                if (!shortcutsInThread || shortcutsInThread.length === 0) {
                    return api.sendMessage("❎ Nhóm của bạn hiện chưa có shortcut nào được thiết lập.", threadID, messageID);
                }
                let listMsg = "📝 Danh sách các shortcut đang hoạt động trong nhóm:\n\n";
                shortcutsInThread.forEach((shortcut, index) => {
                    let typeDisplay = '';
                    let inputDisplay = '';
                    switch (shortcut.input_type) {
                        case 'tag':
                            typeDisplay = 'TAG';
                            inputDisplay = `@${global.data.userName.get(shortcut.tag_id) || shortcut.tag_id}`;
                            break;
                        case 'autosend':
                            typeDisplay = 'AUTO-SEND';
                            inputDisplay = `lúc ${shortcut.hours}`;
                            break;
                        case 'join':
                            typeDisplay = 'WELCOME';
                            inputDisplay = 'khi có thành viên mới';
                            break;
                        case 'leave':
                            typeDisplay = 'GOODBYE';
                            inputDisplay = 'khi có thành viên rời nhóm';
                            break;
                        default:
                            typeDisplay = 'TEXT';
                            inputDisplay = `"${shortcut.input}"`;
                            break;
                    }
                    const hasAttachment = shortcut.uri && shortcut.uri !== 's' ? ' (Có đính kèm)' : '';
                    listMsg += `${index + 1}. [${typeDisplay}] ${inputDisplay} -> "${shortcut.output}"${hasAttachment}\n`;
                });
                listMsg += "\n**Ghi chú:** 'Có đính kèm' nghĩa là shortcut có file ảnh/video/âm thanh.\n**Reply (phản hồi) tin nhắn này kèm STT** để xóa shortcut.";

                return api.sendMessage(listMsg, threadID, (error, info) => {
                    global.client.handleReply.push({
                        type: "delShortcut",
                        name,
                        author: senderID,
                        messageID: info.messageID
                    });
                });
            }
            case "tag": {
                const targetID = Object.keys(mentions)[0] || senderID; // Nếu không tag ai thì lấy senderID
                const taggedName = global.data.userName.get(targetID) || "Người dùng không xác định";

                const shortcutsInThread = global.moduleData.shortcut.get(threadID) || [];
                if (shortcutsInThread.some(item => item.tag_id === targetID)) {
                    return api.sendMessage(`❎ Shortcut tag cho **${taggedName}** đã tồn tại trong nhóm rồi!`, threadID, messageID);
                }

                api.sendMessage(`📌 Tuyệt! Giờ hãy reply tin nhắn này với **câu trả lời** bạn muốn bot phản hồi khi **${taggedName}** được tag:`, threadID, (error, info) => {
                    global.client.handleReply.push({
                        type: "requireOutput",
                        name,
                        author: senderID,
                        messageID: info.messageID,
                        input_type: 'tag',
                        tag_id: targetID
                    });
                }, messageID);
                break;
            }
            case "join": {
                const shortcutsInThread = global.moduleData.shortcut.get(threadID) || [];
                if (shortcutsInThread.some(item => item.input_type === 'join')) {
                    return api.sendMessage("❎ Nhóm này đã có tin nhắn chào thành viên mới rồi! Nếu muốn thay đổi, hãy xóa cái cũ trước.", threadID, messageID);
                }
                api.sendMessage("📌 Hãy reply tin nhắn này với **nội dung chào mừng** thành viên mới. Bạn có thể dùng các biến {name}, {link}, {nameThread}, {soThanhVien}, {authorName}, {authorId}, {qtv}, {time}.", threadID, (err, info) => {
                    global.client.handleReply.push({
                        type: "requireOutput",
                        name: this.config.name,
                        author: senderID,
                        messageID: info.messageID,
                        input_type: 'join',
                    });
                }, messageID);
                break;
            }
            case "leave": {
                const shortcutsInThread = global.moduleData.shortcut.get(threadID) || [];
                if (shortcutsInThread.some(item => item.input_type === 'leave')) {
                    return api.sendMessage("❎ Nhóm này đã có tin nhắn tạm biệt thành viên rồi! Nếu muốn thay đổi, hãy xóa cái cũ trước.", threadID, messageID);
                }
                api.sendMessage("📌 Hãy reply tin nhắn này với **nội dung tạm biệt** thành viên rời nhóm. Bạn có thể dùng các biến {name}, {link}, {nameThread}, {soThanhVien}, {authorName}, {authorId}, {trangThai}, {qtv}, {time}.", threadID, (err, info) => {
                    global.client.handleReply.push({
                        type: "requireOutput",
                        name: this.config.name,
                        author: senderID,
                        messageID: info.messageID,
                        input_type: 'leave',
                    });
                }, messageID);
                break;
            }
            case "autosend": {
                api.sendMessage("📌 Tuyệt vời! Giờ hãy reply tin nhắn này với **nội dung** bạn muốn bot tự động gửi định kỳ. Bạn có thể dùng các biến {name}, {time} (lưu ý: các biến khác như {nameThread}, {soThanhVien}... có thể không chính xác trong context tự động gửi).", threadID, (err, data) => {
                    global.client.handleReply.push({
                        ...data,
                        author: senderID,
                        name: exports.config.name,
                        type: 'autosend.input_content', // Đổi tên cho rõ ràng
                    });
                }, messageID);
                break;
            }
            case "autosend.input_content": { // Case mới cho nội dung autosend (từ handleReply)
                // Logic này sẽ được xử lý trong handleReply
                break;
            }
            case "autosend.input_time": { // Case mới cho thời gian autosend (từ handleReply)
                // Logic này sẽ được xử lý trong handleReply
                break;
            }
            case "empty": {
                if (args[1] === "confirm") {
                    threadData.shortcuts = [];
                    global.moduleData.shortcut.set(threadID, []);

                    const dataIndex = data.findIndex(item => item.threadID === threadID);
                    if (dataIndex !== -1) {
                        data.splice(dataIndex, 1); // Xóa toàn bộ dữ liệu của thread này
                    }
                    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), "utf-8");
                    return api.sendMessage("🗑️ Đã xóa **tất cả** shortcut trong nhóm này!", threadID, messageID);
                } else {
                    return api.sendMessage("⚠️ Bạn có chắc chắn muốn xóa **tất cả** shortcut trong nhóm này không? Lệnh này không thể hoàn tác!\nNếu chắc chắn, hãy dùng: `-shortcut empty confirm`", threadID, messageID);
                }
            }
            default: {
                api.sendMessage("📌 Bạn muốn tạo shortcut cho **từ khóa** nào? Hãy reply tin nhắn này để nhập từ khóa:", threadID, (error, info) => {
                    global.client.handleReply.push({
                        type: "requireInput",
                        name,
                        author: senderID,
                        messageID: info.messageID
                    });
                }, messageID);
            }
        }
    } catch (e) {
        console.error("❌ [Shortcut] Lỗi trong hàm run:", e);
        api.sendMessage("🚨 Đã xảy ra lỗi khi thực thi lệnh shortcut. Vui lòng thử lại!", threadID, messageID);
    }
};

// Hàm upload lên Catbox (thay thế imgurUpload nếu cần)
async function uploadToCatbox(url, fileExtension) {
    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer'
        });

        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', Buffer.from(response.data), `file.${fileExtension}`);

        const uploadResponse = await axios.post('https://catbox.moe/useruploads.php', formData, {
            headers: formData.getHeaders ? formData.getHeaders() : { 'Content-Type': `multipart/form-data; boundary=${formData._boundary}` }
        });

        if (uploadResponse.data && uploadResponse.data.startsWith('https://')) {
            return uploadResponse.data;
        } else {
            console.error("Catbox upload failed:", uploadResponse.data);
            return null;
        }
    } catch (e) {
        console.error("Error uploading to Catbox:", e);
        return null;
    }
}