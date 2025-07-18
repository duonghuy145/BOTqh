module.exports.config = {
    name: "antiout",
    version: "1.0.2", // Cập nhật version để đánh dấu thay đổi về phong cách
    credits: "DungUwU (Đã điều chỉnh bởi qh và Gemini) 👑", // Cập nhật credit
    hasPermission: 1, // Chỉ quản trị viên nhóm mới có quyền sử dụng
    description: "🛡️ Quản lý chức năng tự động thêm lại thành viên rời nhóm.",
    usages: "[on/off]", // Hướng dẫn sử dụng chi tiết hơn
    commandCategory: "Quản Trị Viên",
    cooldowns: 0
};

module.exports.run = async({ api, event, Threads }) => {
    const { threadID, messageID } = event;
    let data = (await Threads.getData(threadID)).data || {};

    // Đảo ngược trạng thái antiout
    if (typeof data["antiout"] === "undefined") {
        data["antiout"] = true;
    } else {
        data["antiout"] = !data["antiout"];
    }

    await Threads.setData(threadID, { data });
    global.data.threadData.set(parseInt(threadID), data);

    const status = data["antiout"] ? "đã KÍCH HOẠT" : "đã VÔ HIỆU HÓA";
    return api.sendMessage(`✅ Chức năng chống rời nhóm tự động ${status} thành công trong hội thoại này.`, threadID, messageID);
};

module.exports.handleEvent = async ({ event, api, Users, Threads }) => {
    const { threadID, author } = event;
    const { logMessageType, logMessageData, logMessageBody } = event;

    // Chỉ xử lý khi có thông báo thành viên rời nhóm
    if (logMessageType === "log:unsubscribe") {
        let data = (await Threads.getData(threadID)).data || {};
        const antioutStatus = data["antiout"] || false;

        // Nếu chức năng antiout không được kích hoạt hoặc người rời nhóm là bot
        if (!antioutStatus || author === api.getCurrentUserID()) {
            return;
        }

        const leftMemberID = logMessageData.leftParticipantFbId;
        const leftMemberName = logMessageBody.split(" ")[0]; // Lấy tên thành viên rời nhóm

        try {
            await api.addUserToGroup(leftMemberID, threadID);
            api.sendMessage(`✨ Thành viên ${leftMemberName} (${leftMemberID}) đã rời khỏi nhóm. Chức năng anti-out đang được kích hoạt, hệ thống đã tự động thêm lại thành viên này.`, threadID);
        } catch (error) {
            console.error("❌ Lỗi khi thêm lại thành viên:", error);
            api.sendMessage(`⚠️ Thành viên ${leftMemberName} (${leftMemberID}) đã rời nhóm nhưng không thể thêm lại. Vui lòng kiểm tra quyền hạn của bot hoặc tình trạng tài khoản thành viên.`, threadID);
        }
    }
};