module.exports.config = {
    "name": "listbox",
    "version": "1.0.1",
    "credits": "Niiozic, qh và Gemini",
    "hasPermssion": 3,
    "description": "[ban/unban/out] danh sách box bot đã tham gia 📊",
    "commandCategory": "admin",
    "usages": "[số trang/all]",
    "cooldowns": 5
};

module.exports.handleReply = async function({ api, event, args, Threads, handleReply }) {
    const { threadID, messageID } = event;
    // Kiểm tra senderID phải trùng với người đã gọi lệnh trước đó
    if (parseInt(event.senderID) !== parseInt(handleReply.author)) {
        return api.sendMessage("Lệnh này chỉ người đã gọi nó mới có quyền phản hồi. 🚫", threadID, messageID);
    }
    const moment = require("moment-timezone");
    const time = moment.tz("asia/ho_chi_minh").format("HH:mm:ss L");
    var arg = event.body.split(" ");

    switch (handleReply.type) {
        case "reply":
            {
                // Chuyển lệnh ban/unban/out sang chữ thường để xử lý đồng bộ
                const commandType = arg[0].toLowerCase();

                if (["ban", "unban", "out"].includes(commandType)) {
                    var arrnum = event.body.split(" ");
                    var msg = "";
                    var nums = arrnum.map(n => parseInt(n));
                    nums.shift(); // Xóa phần tử đầu tiên (lệnh ban/unban/out)

                    if (nums.length === 0 || nums.some(isNaN)) {
                        return api.sendMessage("Vui lòng nhập số thứ tự hợp lệ của các box bạn muốn " + commandType + ". 🔢", threadID, messageID);
                    }

                    let actionMessage = "";
                    let successIcon = "";
                    let failIcon = "❌";
                    let adminContact = "fb.com/qhdz05"; // Liên hệ admin

                    switch (commandType) {
                        case "ban":
                            actionMessage = "» Thực thi ban box «\n";
                            successIcon = "🚫";
                            break;
                        case "unban":
                            actionMessage = "» Thực thi gỡ ban box «\n";
                            successIcon = "✅";
                            break;
                        case "out":
                            actionMessage = "» Thực thi rời khỏi box «\n";
                            successIcon = "👋";
                            break;
                    }

                    for (let num of nums) {
                        if (num <= 0 || num > handleReply.groupid.length) {
                            msg += `Lỗi: số thứ tự ${num} không hợp lệ. ${failIcon}\n`;
                            continue;
                        }
                        var idgr = handleReply.groupid[num - 1];
                        var groupName = handleReply.groupName[num - 1];

                        try {
                            if (commandType === "ban") {
                                const data = (await Threads.getData(idgr)).data || {};
                                data.banned = true;
                                data.dateAdded = time;
                                await Threads.setData(idgr, { data });
                                global.data.threadBanned.set(idgr, { dateAdded: data.dateAdded });
                                msg += `${successIcon} Đã ban box '${groupName}'\n» TID: ${idgr}\n`;
                                api.sendMessage(`📢 Thông báo từ admin 📢\nBox bạn đã bị ban, cấm dùng bot. ${successIcon}\nThắc mắc vui lòng liên hệ admin: ${adminContact}`, idgr);
                            } else if (commandType === "unban") {
                                const data = (await Threads.getData(idgr)).data || {};
                                data.banned = false;
                                data.dateAdded = null;
                                await Threads.setData(idgr, { data });
                                global.data.threadBanned.delete(idgr);
                                msg += `${successIcon} Đã gỡ ban box '${groupName}'\n» TID: ${idgr}\n`;
                                api.sendMessage(`📢 Thông báo từ admin 📢\nBox bạn đã được gỡ ban. ${successIcon}`, idgr);
                            } else if (commandType === "out") {
                                await api.removeUserFromGroup(api.getCurrentUserID(), idgr);
                                msg += `${successIcon} Đã rời khỏi box '${groupName}'\n» TID: ${idgr}\n`;
                                api.sendMessage(`📢 Thông báo từ admin 📢\nBox bạn đã bị cấm và bot sẽ rời khỏi. ${failIcon}\nThắc mắc vui lòng liên hệ admin: ${adminContact}`, idgr);
                            }
                        } catch (error) {
                            msg += `${failIcon} Lỗi khi ${commandType} box '${groupName}'\n» TID: ${idgr}\n Lỗi: ${error.message}\n`;
                            console.error(`Lỗi khi thực hiện ${commandType} cho box ${idgr}:`, error);
                        }
                    }
                    api.sendMessage(`${actionMessage}\n${msg}`, threadID, () => api.unsendMessage(handleReply.messageID));
                } else {
                    return api.sendMessage("Lựa chọn không hợp lệ. Chỉ chấp nhận 'ban', 'unban' hoặc 'out'. ❓", threadID, messageID);
                }
            }
            break;
    }
};

module.exports.run = async function({ api, event, args, Threads }) {
    let page = parseInt(args[0]) || 1;
    let limit = 10;

    if (args[0] && args[0].toLowerCase() === "all") {
        limit = 999999;
        page = 1;
    } else if (page < 1) {
        page = 1;
    }

    try {
        var inbox = await api.getThreadList(100, null, ['INBOX']);
        let list = [...inbox].filter(group => group.isSubscribed && group.isGroup);

        const detailedList = [];
        for (const groupInfo of list) {
            try {
                const threadInfo = await api.getThreadInfo(groupInfo.threadID);
                detailedList.push({
                    id: threadInfo.threadID,
                    name: threadInfo.threadName || "Box không có tên",
                    participants: threadInfo.participantIDs ? threadInfo.participantIDs.length : 0
                });
            } catch (e) {
                console.error(`Lỗi khi lấy thông tin thread ${groupInfo.threadID}:`, e);
                detailedList.push({
                    id: groupInfo.threadID,
                    name: groupInfo.threadName || "Box không có tên",
                    participants: 0
                });
            }
        }

        var listbox = detailedList.sort((a, b) => {
            if (a.participants > b.participants) return -1;
            if (a.participants < b.participants) return 1;
            return 0;
        });

        var groupid = [];
        var groupName = [];
        var msg = "📊 » Danh sách nhóm đã tham gia « 📊\n\n";

        if (listbox.length === 0) {
            msg = "🔍 Bot hiện chưa tham gia nhóm nào cả. 😕";
        } else {
            var numPage = Math.ceil(listbox.length / limit);
            for (var i = limit * (page - 1); i < limit * (page - 1) + limit; i++) {
                if (i >= listbox.length) break;
                let group = listbox[i];
                msg += `${i + 1}. ${group.name}\n🆔 TID: ${group.id}\n👥 Thành viên: ${group.participants}\n\n`;
                groupid.push(group.id);
                groupName.push(group.name);
            }

            if (page > numPage && args[0] !== "all") {
                 return api.sendMessage(`Trang ${page} không tồn tại. Tổng cộng có ${numPage} trang. ❗`, threadID, messageID);
            } else {
                 msg += `--- Trang ${page}/${numPage} ---\n`;
                 if (args[0] !== "all") {
                     msg += `Dùng ${global.config.PREFIX}listbox + số trang để xem thêm.\n`;
                 }
            }
        }

        msg += "\n💬 Reply 'ban [số thứ tự]' để ban box.\n";
        msg += "💬 Reply 'unban [số thứ tự]' để gỡ ban box.\n";
        msg += "💬 Reply 'out [số thứ tự]' để bot rời khỏi box.\n";
        msg += "👉 Có thể reply nhiều số, cách nhau bằng dấu cách. \n";

        api.sendMessage(msg, event.threadID, (e, data) => {
            if (e) return console.error("Lỗi gửi tin nhắn:", e);
            global.client.handleReply.push({
                name: this.config.name,
                author: event.senderID,
                messageID: data.messageID,
                groupid,
                groupName,
                type: 'reply'
            });
        });
    } catch (e) {
        console.error("Lỗi trong lệnh listbox:", e);
        return api.sendMessage(`Đã xảy ra lỗi khi lấy danh sách nhóm: ${e.message} 😭`, threadID, messageID);
    }
};