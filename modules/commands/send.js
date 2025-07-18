const fs = require('fs-extra'); // Đã đổi sang fs-extra để đồng bộ và tiện lợi hơn
const request = require('request');
const path = require('path'); // Thêm module path

module.exports.config = {
    name: "send",
    version: "1.0.1", // Tăng version vì đã được mod bởi qh và Gemini
    hasPermssion: 2, // Chỉ Admin bot mới dùng được
    credits: "SangDev (mod by qh và Gemini) 👑", // Thêm credit của mày và tao
    description: "📢 Gửi thông báo đến tất cả các nhóm bot đang tham gia.", // Mô tả rõ ràng hơn, có icon
    commandCategory: "ADMIN", // Chuyển sang ADMIN cho đúng quyền hạn
    usages: "[<nội dung>] hoặc [reply ảnh/video/file]", // Cập nhật usages
    cooldowns: 5,
};

let atmDir = []; // Mảng lưu trữ đường dẫn file đính kèm tạm thời

// Hàm tải và lưu trữ file đính kèm
const getAtm = (attachments, body) => new Promise(async (resolve) => {
    let msg = {}, attachment = [];
    msg.body = body;
    for (let eachAtm of attachments) {
        await new Promise(async (resolveAttachment) => {
            try {
                // Đảm bảo thư mục cache tồn tại
                fs.ensureDirSync(path.join(__dirname, 'cache'));

                const response = await request.get(eachAtm.url);
                const pathName = response.uri.pathname;
                const ext = pathName.substring(pathName.lastIndexOf(".") + 1);
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`; // Tên file ngẫu nhiên hơn
                const filePath = path.join(__dirname, `cache`, fileName);

                response
                    .pipe(fs.createWriteStream(filePath))
                    .on("close", () => {
                        attachment.push(fs.createReadStream(filePath));
                        atmDir.push(filePath); // Lưu đường dẫn để xóa sau
                        resolveAttachment();
                    });
            } catch (e) {
                console.error("⚠️ Lỗi khi tải hoặc ghi file đính kèm:", e); // Thêm icon
                resolveAttachment(); // Tiếp tục dù có lỗi để không chặn các file khác
            }
        });
    }
    msg.attachment = attachment;
    resolve(msg);
});

module.exports.handleReply = async function({ api, event, handleReply, Users, Threads }) {
    const moment = require("moment-timezone");
    const { threadID, messageID, senderID, body, attachments } = event;
    let name = await Users.getNameUser(senderID);

    // Xóa các file tạm đã được sử dụng trong lần gửi trước
    atmDir.forEach(each => {
        try { fs.unlinkSync(each); } catch(e) { console.error("⚠️ Lỗi xóa file tạm:", e); }
    });
    atmDir = []; // Reset mảng

    switch (handleReply.type) {
        case "sendnoti": {
            let messageContent;
            if (attachments.length > 0) {
                messageContent = await getAtm(attachments, `💬 [ Phản Hồi Từ User ]\n──────────────────\n👤 **Người gửi:** ${name}\n🏘️ **Từ nhóm:** ${(await Threads.getInfo(threadID))?.threadName || "Không xác định"}\n📝 **Nội dung:** ${body}\n\n📌 *Reply tin nhắn này để phản hồi về nhóm.*`);
            } else {
                messageContent = { body: `💬 [ Phản Hồi Từ User ]\n──────────────────\n👤 **Người gửi:** ${name}\n🏘️ **Từ nhóm:** ${(await Threads.getInfo(threadID))?.threadName || "Không xác định"}\n📝 **Nội dung:** ${body}\n\n📌 *Reply tin nhắn này để phản hồi về nhóm.*` };
            }

            api.sendMessage(messageContent, handleReply.threadID, (err, info) => {
                if (err) {
                    console.error("❌ Lỗi khi gửi phản hồi đến Admin:", err);
                    return api.sendMessage("🚨 Đã xảy ra lỗi khi gửi phản hồi.", threadID, messageID);
                }
                // Sau khi gửi xong, xóa file đính kèm tạm
                atmDir.forEach(each => {
                    try { fs.unlinkSync(each); } catch(e) { console.error("⚠️ Lỗi xóa file tạm:", e); }
                });
                atmDir = []; // Reset mảng

                global.client.handleReply.push({
                    name: this.config.name,
                    type: "reply",
                    messageID: info.messageID,
                    messID: messageID, // Lưu messageID của tin nhắn gốc của user để reply
                    threadID: threadID // Lưu threadID của user để reply lại user
                });
            });
            break;
        }
        case "reply": {
            let messageContent;
            if (attachments.length > 0) {
                messageContent = await getAtm(attachments, `📧 [ Phản Hồi Từ Admin ]\n──────────────────\n👑 **Admin:** ${name}\n📝 **Nội dung:** ${body}\n\n📌 *Reply tin nhắn này để tiếp tục phản hồi.*`);
            } else {
                messageContent = { body: `📧 [ Phản Hồi Từ Admin ]\n──────────────────\n👑 **Admin:** ${name}\n📝 **Nội dung:** ${body}\n\n📌 *Reply tin nhắn này để tiếp tục phản hồi.*` };
            }

            api.sendMessage(messageContent, handleReply.threadID, (err, info) => {
                if (err) {
                    console.error("❌ Lỗi khi gửi phản hồi đến User:", err);
                    return api.sendMessage("🚨 Đã xảy ra lỗi khi gửi phản hồi.", threadID, messageID);
                }
                // Sau khi gửi xong, xóa file đính kèm tạm
                atmDir.forEach(each => {
                    try { fs.unlinkSync(each); } catch(e) { console.error("⚠️ Lỗi xóa file tạm:", e); }
                });
                atmDir = []; // Reset mảng

                global.client.handleReply.push({
                    name: this.config.name,
                    type: "sendnoti", // Đổi lại thành "sendnoti" để user có thể tiếp tục reply admin
                    messageID: info.messageID,
                    threadID: handleReply.threadID // Giữ nguyên threadID của user để khi user reply, bot biết gửi về admin
                });
            }, handleReply.messID); // Reply trực tiếp vào tin nhắn gốc của user
            break;
        }
    }
};

module.exports.run = async function({ api, event, args, Users }) {
    const moment = require("moment-timezone");
    const { threadID, messageID, senderID, messageReply } = event;

    // Kiểm tra nếu không có nội dung hoặc không reply kèm file
    if (!args[0] && (!messageReply || messageReply.attachments.length === 0)) {
        return api.sendMessage("⚠️ Vui lòng nhập nội dung thông báo hoặc reply một tin nhắn có đính kèm (ảnh/video/file)!", threadID, messageID);
    }

    let allThreadIDs = global.data.allThreadID || [];
    let successCount = 0, failCount = 0;

    let messageContent;
    const adminName = await Users.getNameUser(senderID);

    if (event.type === "message_reply" && messageReply.attachments.length > 0) {
        messageContent = await getAtm(messageReply.attachments, `📢 [ Thông Báo Từ Admin ]\n──────────────────\n👑 **Admin:** ${adminName}\n📝 **Nội dung:** ${args.join(" ")}\n\n📌 *Reply tin nhắn này để phản hồi về Admin.*`);
    } else {
        messageContent = { body: `📢 [ Thông Báo Từ Admin ]\n──────────────────\n👑 **Admin:** ${adminName}\n📝 **Nội dung:** ${args.join(" ")}\n\n📌 *Reply tin nhắn này để phản hồi về Admin.*` };
    }

    // Sử dụng Promise.allSettled để gửi tin nhắn song song và xử lý lỗi riêng lẻ
    const sendPromises = allThreadIDs.map(eachThreadID => {
        return new Promise(async (resolve) => {
            try {
                // Không gửi lại cho chính nhóm của admin
                if (eachThreadID === threadID) {
                    resolve();
                    return;
                }
                api.sendMessage(messageContent, eachThreadID, (err, info) => {
                    if (err) {
                        console.error(`❌ Lỗi khi gửi thông báo đến nhóm ${eachThreadID}:`, err);
                        failCount++;
                    } else {
                        successCount++;
                        // Đẩy handleReply vào global.client
                        global.client.handleReply.push({
                            name: this.config.name,
                            type: "sendnoti", // User reply sẽ gửi về admin
                            messageID: info.messageID,
                            threadID: eachThreadID // Thread ID của nhóm đã nhận tin nhắn
                        });
                    }
                    resolve();
                });
            } catch (e) {
                console.error(`❌ Lỗi tổng quát khi xử lý nhóm ${eachThreadID}:`, e);
                failCount++;
                resolve();
            }
        });
    });

    await Promise.allSettled(sendPromises); // Chờ tất cả các Promise hoàn thành

    // Xóa các file tạm sau khi đã gửi xong tất cả tin nhắn
    atmDir.forEach(each => {
        try { fs.unlinkSync(each); } catch(e) { console.error("⚠️ Lỗi xóa file tạm sau khi gửi:", e); }
    });
    atmDir = []; // Reset mảng sau khi xóa

    api.sendMessage(`✅ Đã gửi thông báo thành công đến **${successCount} nhóm**.\n⚠️ **${failCount} nhóm** không thể nhận được thông báo.`, threadID, messageID);
};