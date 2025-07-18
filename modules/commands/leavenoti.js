module.exports.config = {
    name: "leavenoti",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "qh và Gemini",
    description: "Bật hoặc tắt thông báo khi có thành viên rời khỏi nhóm.",
    commandCategory: "Quản Trị Viên",
    usages: "[on/off]",
    cooldowns: 5,
};

module.exports.run = async function({ api, event, Threads, args }) {
    const { threadID, messageID } = event;
    let threadData = await Threads.getData(threadID);
    let data = threadData.data || {};

    if (args.length === 0) {
        return api.sendMessage("Này qh! Dùng /leavenoti [on/off] để bật hoặc tắt thông báo khi có người rời nhóm. 🧐", threadID, messageID);
    }

    if (args[0].toLowerCase() === "on") {
        data.leaveNoti = true;
        await Threads.setData(threadID, { data });
        global.data.threadData.set(threadID, data);
        return api.sendMessage("✅ Đã **bật thông báo** thành viên rời khỏi nhóm này rồi nhé.", threadID, messageID);
    }

    if (args[0].toLowerCase() === "off") {
        data.leaveNoti = false;
        await Threads.setData(threadID, { data });
        global.data.threadData.set(threadID, data);
        return api.sendMessage("❌ Đã **tắt thông báo** thành viên rời khỏi nhóm này rồi.", threadID, messageID);
    }

    return api.sendMessage("⚠️ Sai cú pháp rồi đó. Chỉ nhập '/leavenoti on' hoặc '/leavenoti off' thôi.", threadID, messageID);
};