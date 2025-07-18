const fs = require('fs'),
  path = require('path'),
  moment = require("moment-timezone"),
  fse = require("fs-extra"); // Đã thêm fse vào đây cho tiện dùng

module.exports.config = {
  name: "joinnoti",
  eventType: ["log:subscribe"],
  version: "1.0.2", // Tăng version lên
  credits: "Mirai Team, qh và Gemini mod", // Cập nhật credits (để dễ quản lý, dù mày không yêu cầu sửa)
  description: "Thông báo bot hoặc người vào nhóm một cách sang chảnh",
  dependencies: {
    "fs-extra": "",
    "path": "",
    "pidusage": "" // Mặc dù pidusage không dùng trong file này, giữ lại nếu module khác cần
  }
};

let _0 = x => x < 10 ? '0' + x : x; // Hàm thêm số 0 vào trước số < 10
let time_str = time => (d => `${_0(d.getHours())}:${_0(d.getMinutes())}:${_0(d.getSeconds())} - ${_0(d.getDate())}/${_0(d.getMonth()+1)}/${d.getFullYear()} (Thứ ${d.getDay()==0?'Chủ Nhật':d.getDay()+1})`)(new Date(time));

module.exports.onLoad = function () {
    const { existsSync, mkdirSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];

  const cachePath = join(__dirname, "cache", "joinGif");
  if (!existsSync(cachePath)) mkdirSync(cachePath, { recursive: true });	

  const randomGifPath = join(__dirname, "cache", "joinGif", "randomgif");
    if (!existsSync(randomGifPath)) mkdirSync(randomGifPath, { recursive: true });

    return;
}

module.exports.run = async function({ api, event, Users, Threads }) {
    const { threadID } = event;
    const send = (content, threadID, messageID) => api.sendMessage(content, threadID, messageID);

    // Kiểm tra cấu hình nhóm (nếu có)
    const thread = global.data.threadData.get(threadID) || {};
    if (typeof thread["joinNoti"] != "undefined" && thread["joinNoti"] == false) return;

  if (event.logMessageData.addedParticipants.some(i => i.userFbId == api.getCurrentUserID())) {
    // GIỮ NGUYÊN CODE KẾT NỐI THÀNH CÔNG CỦA MÀY
    api.changeNickname(`『 ${global.config.PREFIX} 』 ⪼ ${(!global.config.BOTNAME) ? "Made by Khôi" : global.config.BOTNAME}`, threadID, api.getCurrentUserID());
    const fs = require("fs");
var mlg="╭────────────────────────╮\n│===【 KẾT NỐI THÀNH CÔNG 】===  │\n╰────────────────────────╯\nĐã load toàn bộ lệnh và người dùng trong nhóm.\n❌ Nếu nhóm của bạn chưa kích hoạt sử dụng bot, vui lòng sử dụng lệnh 'callad' để liên hệ Admin.\n─────────────────\n🌐 Facebook: fb.com/qhdz05"
return api.sendMessage(threadID,async () => {
await api.shareContact(`${mlg}`, 100083411540341, threadID);
});

  }
  else {
    // ĐÂY LÀ PHẦN CODE CHÀO MỪNG THÀNH VIÊN MỚI ĐÃ ĐƯỢC MOD LẠI
    try {
            let thread_data = await Threads.getData(threadID);

            // Xử lý auto_set_nickname nếu có
            if (!!thread_data && thread_data.data && thread_data.data.auto_set_nickname) {
                let asnn = thread_data.data.auto_set_nickname;
                if (!!asnn && !!asnn.all) {
                    let time_join = time_str(Date.now() + 25200000); // +7 hours for Asia/Ho_Chi_Minh
                    for (let { fullName, firstName, userFbId: id } of event.logMessageData.addedParticipants) {
                        try {
                            let name_set = asnn.all.replace(/\${full_name}/g, fullName).replace(/\${short_name}/g, firstName).replace(/\${time_join}/g, time_join);
                            await new Promise(resolve => api.changeNickname(name_set, threadID, id, (err, res) => resolve()));
                        } catch (e) {
                            console.error("Lỗi set biệt danh:", e);
                        }
                    }
                    send(`Đã tự động set biệt danh cho các thành viên mới vừa tham gia.`);
                }
            }

      let { threadName, participantIDs } = await api.getThreadInfo(threadID);
            const timeMoment = moment.tz("Asia/Ho_Chi_Minh");
            const time = timeMoment.format("HH:mm:ss - DD/MM/YYYY");
            const hours = timeMoment.format("HH");
            let thu = timeMoment.format('dddd');
            if (thu == 'Sunday') thu = 'Chủ Nhật';
            if (thu == 'Monday') thu = 'Thứ Hai';
            if (thu == 'Tuesday') thu = 'Thứ Ba';
            if (thu == 'Wednesday') thu = 'Thứ Tư';
            if (thu == "Thursday") thu = 'Thứ Năm';
            if (thu == 'Friday') thu = 'Thứ Sáu';
            if (thu == 'Saturday') thu = 'Thứ Bảy';

      var mentions = [], nameArray = [], iduser = [];

      for (const participant of event.logMessageData.addedParticipants) {
                const userName = participant.fullName;
                iduser.push(participant.userFbId.toString());
                nameArray.push(userName);
                mentions.push({ tag: userName, id: participant.userFbId }); // mention đúng ID người dùng mới
      }

            const authorInfo = await Users.getData(event.author);
            const nameAuthor = authorInfo && typeof authorInfo.name != "undefined" ? authorInfo.name : "Một thành viên";

            // NỘI DUNG CHÀO MỪNG THÀNH VIÊN MỚI ĐÃ ĐƯỢC VIẾT LẠI CHO SANG HƠN
            let msg = `🌟 Chào mừng {name} đã gia nhập Đại Gia Đình {threadName}! 🌟
─────────────────────────
✨ Vị trí thành viên thứ: {soThanhVien}
👤 Được chào đón bởi: {author}
─────────────────────────
⏰ Thời gian: {time} - {session} {thu}
💖 Chúc {type} có những khoảnh khắc thật vui vẻ và đáng nhớ cùng mọi người!`;

            // Thay đổi cách lấy {soThanhVien} để nó là tổng số thành viên hiện tại
            const currentMemberCount = participantIDs.length;

            // Thay thế các placeholder
            msg = msg
                .replace(/\{iduser}/g, iduser.join(', '))
                .replace(/\{name}/g, nameArray.join(', '))
                .replace(/\{type}/g, (nameArray.length > 1) ? 'các bạn' : 'bạn')
                .replace(/\{soThanhVien}/g, currentMemberCount) // Đã sửa
                .replace(/\{author}/g, nameAuthor)
                .replace(/\{idauthor}/g, event.author)
                .replace(/\{threadName}/g, threadName)
                .replace(/\{thu}/g, thu)
                .replace(/\{session}/g, 
                    (parseInt(hours) >= 5 && parseInt(hours) < 11) ? "buổi sáng ☀️" :
                    (parseInt(hours) >= 11 && parseInt(hours) < 13) ? "buổi trưa 🕛" :
                    (parseInt(hours) >= 13 && parseInt(hours) < 18) ? "buổi chiều 🌅" : "buổi tối 🌙"
                )
                .replace(/\{time}/g, time);

            // Gửi tin nhắn chào mừng thông thường, kèm theo mentions
            return api.sendMessage({
                body: msg,
                mentions: mentions // Quan trọng: dùng mentions để mention đúng người mới vào
            }, threadID, event.messageID);

    } catch (e) {
            console.error("Lỗi khi xử lý thành viên mới:", e);
            // Gửi tin nhắn lỗi đơn giản hơn cho người dùng
            send("Đã xảy ra lỗi khi chào mừng thành viên mới. Vui lòng kiểm tra console.", threadID);
        }
  }
}