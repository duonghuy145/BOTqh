module.exports.config = {
    name: "leavenoti",
    eventType: ["log:unsubscribe"],
    version: "1.0.2", // Tăng version lên để đánh dấu thay đổi
    credits: "HĐGN, qh và Gemini mod", // Cập nhật credits
    description: "Thông báo người dùng rời khỏi nhóm (chỉ tin nhắn thuần túy)",
    dependencies: {
        "fs-extra": "", // Vẫn giữ fs-extra và path vì một số hàm vẫn dùng
        "path": ""
    }
};

const checkttPath = __dirname + '/../commands/_checktt/'

module.exports.onLoad = function () {
    // Không cần tạo thư mục cache/leaveGif nữa vì không dùng file
    return;
}

module.exports.run = async function ({ api, event, Users, Threads }) {
    // Nếu bot tự rời nhóm, không làm gì cả
    if (event.logMessageData.leftParticipantFbId == api.getCurrentUserID()) return;

    // Bỏ require fs-extra và path nếu không dùng, nhưng giữ lại cho an toàn nếu code khác cần
    const { threadID, messageID } = event; 
    const moment = require("moment-timezone");
    const time = moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss - DD/MM/YYYY");
    const hours = moment.tz("Asia/Ho_Chi_Minh").format("HH");
    var thu = moment.tz('Asia/Ho_Chi_Minh').format('dddd');
    if (thu == 'Sunday') thu = 'Chủ Nhật';
    if (thu == 'Monday') thu = 'Thứ Hai';
    if (thu == 'Tuesday') thu = 'Thứ Ba';
    if (thu == 'Wednesday') thu = 'Thứ Tư';
    if (thu == "Thursday") thu = 'Thứ Năm';
    if (thu == 'Friday') thu = 'Thứ Sáu';
    if (thu == 'Saturday') thu = 'Thứ Bảy';

    const data = global.data.threadData.get(parseInt(threadID)) || (await Threads.getData(threadID)).data;
    const name = global.data.userName.get(event.logMessageData.leftParticipantFbId) || await Users.getNameUser(event.logMessageData.leftParticipantFbId);
    const uid = event.logMessageData.leftParticipantFbId;
    const type = (event.author == event.logMessageData.leftParticipantFbId) ? "Đã tự động rời khỏi nhóm." : "Đã bị Quản trị viên xóa khỏi nhóm.";

    // Tạo đối tượng mentions cho người rời nhóm để tag họ trong tin nhắn
    const mentions = [{ tag: name, id: uid }];

    // Phần xử lý checktt (giữ nguyên theo yêu cầu của mày)
    if (global.nodemodule["fs-extra"].existsSync(checkttPath + threadID + '.json')) {
        const threadData = JSON.nodemodule["fs-extra"].readFileSync(checkttPath + threadID + '.json', 'utf8'); // Đọc file với encoding
        const parsedThreadData = JSON.parse(threadData); // Parse JSON

        const userData_week_index = parsedThreadData.week.findIndex(e => e.id == event.logMessageData.leftParticipantFbId);
        const userData_day_index = parsedThreadData.day.findIndex(e => e.id == event.logMessageData.leftParticipantFbId);
        const userData_total_index = parsedThreadData.total.findIndex(e => e.id == event.logMessageData.leftParticipantFbId);

        if (userData_total_index != -1) {
            parsedThreadData.total.splice(userData_total_index, 1);
        }
        if (userData_week_index != -1) {
            parsedThreadData.week.splice(userData_week_index, 1);
        }
        if (userData_day_index != -1) {
            parsedThreadData.day.splice(userData_day_index, 1);
        }

        global.nodemodule["fs-extra"].writeFileSync(checkttPath + threadID + '.json', JSON.stringify(parsedThreadData, null, 4));
    }
    // End phần checktt

    // Nội dung tin nhắn rời nhóm đã được làm "sang" hơn
    let msg;
    (typeof data.customLeave == "undefined") ? msg = `───・─── { TRUY CẬP BỊ CHẤM DỨT } ───・───
💔 Tạm biệt {name} ({uid})
👋 {type}

🗓️ Khoảnh khắc rời đi: {time} ({thu})

Hy vọng {name} sẽ tìm thấy những điều tốt đẹp phía trước và luôn giữ những kỷ niệm đẹp về nhóm chúng ta!
───・─── 💔 HẸN GẶP LẠI 💔 ───・───` : msg = data.customLeave;

    msg = msg
        .replace(/\{name}/g, name)
        .replace(/\{type}/g, type)
        .replace(/\{time}/g, time)
        .replace(/\{uid}/g, uid)
        .replace(/\{thu}/g, thu);

    // Gửi tin nhắn thuần túy, kèm theo tag người rời nhóm
    return api.sendMessage({
        body: msg,
        mentions: mentions // Dùng mentions để tag người rời nhóm
    }, threadID, messageID);
}