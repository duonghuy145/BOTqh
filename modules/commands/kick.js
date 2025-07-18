module.exports.config = {
    name: "kick",
    version: "1.0.1", // Nâng version lên xíu ⬆️
    hasPermssion: 1, // 1 = QTV nhóm trở lên có thể dùng
    credits: "D-Jukie, modded by qh and Gemini ✨", // Giữ nguyên credits gốc và thêm tên chúng ta
    description: "xoá người bạn cần xoá khỏi nhóm bằng cách tag hoặc reply 💥", // Chữ thường, viết hoa đầu dòng + icon
    commandCategory: "quản trị viên ⚙️", // Chữ thường, viết hoa đầu dòng + icon
    usages: "[tag/reply/all]",
    cooldowns: 5 // Đặt lại cooldowns 5 giây để tránh spam
};

module.exports.run = async function ({ api, event, args, Threads }) {
    const { threadID, messageID, senderID } = event;
    const botID = api.getCurrentUserID();

    try {
        const { participantIDs } = (await Threads.getData(threadID)).threadInfo;
        const targetIDs = []; // Mảng chứa các ID cần kick

        if (args[0] === "all") {
            // Kiểm tra xem bot có phải là quản trị viên không trước khi thực hiện kick all
            const threadInfo = await api.getThreadInfo(threadID);
            if (!threadInfo.adminIDs.some(admin => admin.id === botID)) {
                return api.sendMessage("Bot cần quyền quản trị viên để kick tất cả thành viên nhé! 🤖", threadID, messageID);
            }

            api.sendMessage("Đang tiến hành kick tất cả thành viên... Chờ chút nhé! ⏳", threadID, messageID);
            // Lọc ra tất cả thành viên trừ bot và người gửi lệnh
            for (const userID of participantIDs) {
                if (userID !== botID && userID !== senderID) {
                    targetIDs.push(userID);
                }
            }
            if (targetIDs.length === 0) {
                return api.sendMessage("Không tìm thấy thành viên nào để kick. Có thể chỉ còn bạn và bot trong nhóm thôi! 😅", threadID, messageID);
            }
        } else if (event.type === "message_reply") {
            const repliedUserID = event.messageReply.senderID;
            if (repliedUserID === botID) {
                return api.sendMessage("Bạn không thể kick bot đâu nhé! 🤖", threadID, messageID);
            }
            if (repliedUserID === senderID) {
                return api.sendMessage("Bạn không thể tự kick chính mình đâu nhé! 🤔", threadID, messageID);
            }
            targetIDs.push(repliedUserID);
        } else if (Object.keys(event.mentions).length > 0) {
            const mentionIDs = Object.keys(event.mentions);
            for (const mentionID of mentionIDs) {
                if (mentionID === botID) {
                    return api.sendMessage("Bạn không thể kick bot đâu nhé! 🤖", threadID, messageID);
                }
                if (mentionID === senderID) {
                    return api.sendMessage("Bạn không thể tự kick chính mình đâu nhé! 🤔", threadID, messageID);
                }
                targetIDs.push(mentionID);
            }
        } else {
            return api.sendMessage("Vui lòng tag, reply người cần kick hoặc dùng 'kick all' để kick tất cả. 📝", threadID, messageID); // Chữ thường, viết hoa đầu dòng + icon
        }

        if (targetIDs.length === 0) {
            return api.sendMessage("Không tìm thấy đối tượng hợp lệ để kick. 🚫", threadID, messageID);
        }

        for (let i = 0; i < targetIDs.length; i++) {
            const userID = targetIDs[i];
            setTimeout(async () => {
                try {
                    await api.removeUserFromGroup(userID, threadID);
                    // Có thể thêm log hoặc thông báo nếu cần thiết
                } catch (error) {
                    console.error(`Lỗi khi kick người dùng ${userID}:`, error);
                    api.sendMessage(`Không thể kick người dùng ${userID}. Có thể bot không có quyền hoặc người đó là quản trị viên. ⚠️`, threadID, messageID);
                }
            }, i * 1000); // Kick mỗi người sau 1 giây để tránh bị flood API
        }

        // Gửi thông báo tổng quát sau khi bắt đầu quá trình kick (trừ kick all đã có thông báo riêng)
        if (args[0] !== "all") {
             api.sendMessage("Đã bắt đầu quá trình kick thành viên được chỉ định. ✨", threadID, messageID);
        }

    } catch (error) {
        console.error("Lỗi xảy ra khi thực thi lệnh kick:", error);
        // Kiểm tra lỗi quyền quản trị viên cụ thể
        if (error.errorDescription && error.errorDescription.includes("not admin")) {
             return api.sendMessage('Bot cần quyền quản trị viên để thực hiện lệnh này nhé! 🤖', threadID, messageID);
        }
        return api.sendMessage('Đã xảy ra lỗi không mong muốn khi thực hiện lệnh. Vui lòng thử lại sau. 😥', threadID, messageID);
    }
};