module.exports.config = {
    name: "pending",
    version: "1.0.7", // Nâng cấp version
    credits: "Niiozic, qh và Gemini", // Thêm credit của mày và tao
    hasPermssion: 3, // Quyền admin bot
    description: "Quản lý các cuộc trò chuyện (nhóm/người dùng) đang chờ duyệt. 📥", // Mô tả ngắn gọn, có icon
    commandCategory: "quản trị viên", // Chuyển sang chữ thường
    usages: "[u | t | a]", // Rút gọn và rõ ràng hơn
    cooldowns: 5
};

module.exports.handleReply = async function({ api, event, handleReply }) {
    const { body, threadID, messageID, senderID } = event;

    // Chỉ người gửi lệnh gốc mới được reply
    if (String(senderID) !== String(handleReply.author)) return;

    const input = body.toLowerCase().trim();
    let approvedCount = 0;
    let rejectedCount = 0;

    // Hàm xử lý duyệt từng mục
    const processItem = async (item, actionType) => {
        try {
            if (actionType === 'approve') {
                if (item.isGroup) { // Chỉ đổi biệt danh nếu là nhóm
                    await api.changeNickname(`[ ${global.config.PREFIX} ] • ${(!global.config.BOTNAME) ? "✅" : global.config.BOTNAME}`, item.threadID, api.getCurrentUserID());
                }
                await api.sendMessage(`✅ Chào bạn! Bot đã được Admin phê duyệt thành công và sẵn sàng phục vụ. `, item.threadID);
                approvedCount++;
            } else if (actionType === 'reject') {
                await api.removeUserFromGroup(api.getCurrentUserID(), item.threadID); // Bot rời khỏi nhóm/chặn user
                rejectedCount++;
            }
        } catch (error) {
            console.error(`Lỗi khi ${actionType} ${item.threadID}:`, error);
            // Không gửi lỗi ra thread để tránh spam, chỉ ghi log
        }
    };

    // Xử lý tất cả (all)
    if (input === "all") {
        for (const item of handleReply.pending) {
            await processItem(item, 'approve');
        }
        return api.sendMessage(`🎉 Hoàn tất! Đã phê duyệt ${approvedCount} cuộc trò chuyện đang chờ. `, threadID, messageID);
    } 
    // Xử lý từ chối (c/cancel + số thứ tự)
    else if (input.startsWith("c") || input.startsWith("cancel")) {
        const indicesToReject = input.replace(/c(ancel)?\s*/, '').split(/\s+/).filter(Boolean).map(Number);

        if (indicesToReject.length === 0) {
            return api.sendMessage(`⚠️ Cú pháp sai! Để từ chối, hãy nhập 'c' hoặc 'cancel' kèm số thứ tự (ví dụ: c 1 3). `, threadID, messageID);
        }

        for (const index of indicesToReject) {
            if (index > 0 && index <= handleReply.pending.length) {
                await processItem(handleReply.pending[index - 1], 'reject');
            } else {
                return api.sendMessage(`⚠️ Lỗi: "${index}" không phải là số thứ tự hợp lệ. Vui lòng kiểm tra lại! `, threadID, messageID);
            }
        }
        return api.sendMessage(`🚫 Đã từ chối ${rejectedCount} cuộc trò chuyện thành công. `, threadID, messageID);
    } 
    // Xử lý duyệt theo số thứ tự
    else if (!isNaN(input) && parseInt(input) > 0) {
        const indicesToApprove = input.split(/\s+/).filter(Boolean).map(Number);

        for (const index of indicesToApprove) {
            if (index > 0 && index <= handleReply.pending.length) {
                await processItem(handleReply.pending[index - 1], 'approve');
            } else {
                return api.sendMessage(`⚠️ Lỗi: "${index}" không phải là số thứ tự hợp lệ. Vui lòng kiểm tra lại! `, threadID, messageID);
            }
        }
        return api.sendMessage(`🎉 Đã phê duyệt ${approvedCount} cuộc trò chuyện thành công. `, threadID, messageID);
    } 
    // Sai cú pháp chung
    else {
        return api.sendMessage("❓ Sai cú pháp rồi! Vui lòng reply số thứ tự để duyệt, 'c' hoặc 'cancel' kèm số thứ tự để từ chối, hoặc 'all' để duyệt tất cả. ", threadID, messageID);
    }
};


module.exports.run = async function({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const commandName = this.config.name;
    const typeArg = args[0] ? args[0].toLowerCase() : "";

    let listToDisplay = [];
    let title = "";

    try {
        const spamThreads = await api.getThreadList(100, null, ["OTHER"]) || [];
        const pendingThreads = await api.getThreadList(100, null, ["PENDING"]) || [];
        const allThreadsAndUsers = [...spamThreads, ...pendingThreads];

        if (typeArg === "user" || typeArg === "u" || typeArg === "-u") {
            listToDisplay = allThreadsAndUsers.filter(item => item.isGroup === false);
            title = "người dùng";
        } else if (typeArg === "thread" || typeArg === "t" || typeArg === "-t") {
            listToDisplay = allThreadsAndUsers.filter(item => item.isSubscribed && item.isGroup);
            title = "nhóm";
        } else if (typeArg === "all" || typeArg === "a" || typeArg === "-a" || typeArg === "al") {
            listToDisplay = allThreadsAndUsers.filter(item => item.isSubscribed); // Lọc cả user và nhóm đã subscribe
            title = "người dùng và nhóm";
        } else {
            // Hướng dẫn nếu không có đối số hoặc đối số sai
            return api.sendMessage(
                "✨ Hướng dẫn sử dụng `pending`:\n" +
                "  `pending u` (người dùng chờ)\n" +
                "  `pending t` (nhóm chờ)\n" +
                "  `pending a` (tất cả)\n" +
                "👉 Reply STT để duyệt, 'c' + STT để từ chối, hoặc 'all' để duyệt tất cả. ",
                threadID,
                messageID
            );
        }

        if (listToDisplay.length === 0) {
            return api.sendMessage(`✅ Tuyệt vời! Hiện không có ${title} nào trong danh sách chờ duyệt. `, threadID, messageID);
        }

        let msgBody = `📋 **Tổng ${listToDisplay.length} ${title} đang chờ:**\n\n`; // Tiêu đề gọn gàng hơn
        let index = 1;
        for (const item of listToDisplay) {
            msgBody += `${index++}. ${item.name || "Không có tên"}\nID: ${item.threadID}\n`;
        }
        msgBody += `\n❓ Reply STT để duyệt, 'c' + STT để từ chối, hoặc 'all' để duyệt tất cả. `; // Hướng dẫn ngắn gọn

        return api.sendMessage(msgBody, threadID, (error, info) => {
            if (error) {
                console.error("Lỗi khi gửi danh sách pending:", error);
                return api.sendMessage("⚠️ Rất tiếc! Đã xảy ra lỗi khi tạo danh sách chờ. ", threadID, messageID);
            }
            global.client.handleReply.push({
                name: commandName,
                messageID: info.messageID,
                author: senderID,
                pending: listToDisplay
            });
        }, messageID);

    } catch (e) {
        console.error("Lỗi khi lấy danh sách chờ:", e);
        return api.sendMessage("⚠️ Đã xảy ra sự cố không mong muốn khi truy xuất danh sách chờ. Vui lòng thử lại sau! ", threadID, messageID);
    }
};