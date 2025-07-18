module.exports.config = {
    name: "joinnoti",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "qh và Gemini",
    description: "Bật hoặc tắt thông báo khi có thành viên mới vào nhóm.",
    commandCategory: "Quản Trị Viên",
    usages: "[on/off]",
    cooldowns: 5,
};

module.exports.run = async function({ api, event, Threads, args }) {
    const { threadID, messageID } = event;
    let threadData = await Threads.getData(threadID);
    let data = threadData.data || {};

    if (args.length === 0) {
        return api.sendMessage("Dùng /joinnoti [on/off] đi qh. Muốn bật hay tắt thông báo người mới vào nhóm đây? 🤔", threadID, messageID);
    }

    if (args[0].toLowerCase() === "on") {
        data.joinNoti = true;
        await Threads.setData(threadID, { data });
        global.data.threadData.set(threadID, data);
        return api.sendMessage("✅ Ok! Đã **bật thông báo** thành viên mới tham gia nhóm này rồi nhé.", threadID, messageID);
    }

    if (args[0].toLowerCase() === "off") {
        data.joinNoti = false;
        await Threads.setData(threadID, { data });
        global.data.threadData.set(threadID, data);
        return api.sendMessage("❌ Xong! Đã **tắt thông báo** khi có thành viên mới tham gia nhóm này rồi.", threadID, messageID);
    }

    return api.sendMessage("⚠️ Sai cú pháp rồi đó. Nhập '/joinnoti on' hoặc '/joinnoti off' thôi nha.", threadID, messageID);
};