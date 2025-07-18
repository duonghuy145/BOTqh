module.exports.config = {
  name: "check",
  version: "1.0.2", // Tăng version để bạn dễ phân biệt
  hasPermssion: 0,
  credits: "DungUwU && Nghĩa & qh", // Thêm credits của bạn vào đây
  description: "Check tương tác ngày/tuần/toàn bộ với giao diện mới mẻ!", // Cập nhật mô tả
  commandCategory: "Thành Viên",
  usages: "[all/week/day]",
  cooldowns: 5, // Tăng cooldown một chút để tránh spam
  dependencies: {
    "fs-extra": " ",
    "moment-timezone": " "
  }
};

const path = __dirname + '/checktt/';
const moment = require('moment-timezone');

module.exports.onLoad = () => {
  const fs = require('fs-extra');
  if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
    fs.mkdirSync(path, { recursive: true });
  }
  setInterval(() => {
    const today = moment.tz("Asia/Ho_Chi_Minh").day();
    const checkttData = fs.readdirSync(path);
    checkttData.forEach(file => {
      try { var fileData = JSON.parse(fs.readFileSync(path + file)) } catch { return fs.unlinkSync(path+file) };
      if (fileData.time != today) {
        setTimeout(() => {
          fileData = JSON.parse(fs.readFileSync(path + file));
          if (fileData.time != today) {
            fileData.time = today;
            fs.writeFileSync(path + file, JSON.stringify(fileData, null, 4));
          }
        }, 60 * 1000);
      }
    })
  }, 60 * 1000);
}

module.exports.handleEvent = async function({ api, event, Threads }) {
  try{
  if (!event.isGroup) return;
  if (global.client.sending_top == true) return;
  const fs = global.nodemodule['fs-extra'];
  const { threadID, senderID } = event;
  const today = moment.tz("Asia/Ho_Chi_Minh").day();

  if (!fs.existsSync(path + threadID + '.json')) {
    var newObj = {
      total: [],
      week: [],
      day: [],
      time: today,
      last: {
        time: today,
        day: [],
        week: [],
      },
    };
    fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));} else {
      var newObj = JSON.parse(fs.readFileSync(path + threadID + '.json'));
    }
    if (true) { // Giữ nguyên logic cũ, không thay đổi phần này
      const UserIDs = event.participantIDs || [];
      if (UserIDs.length!=0)for (let user of UserIDs) {
        if (!newObj.last)newObj.last = {
          time: today,
          day: [],
          week: [],
        };
        if (!newObj.last.week.find(item => item.id == user)) {
          newObj.last.week.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.last.day.find(item => item.id == user)) {
          newObj.last.day.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.total.find(item => item.id == user)) {
          newObj.total.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.week.find(item => item.id == user)) {
          newObj.week.push({
            id: user,
            count: 0
          });
        }
        if (!newObj.day.find(item => item.id == user)) {
          newObj.day.push({
            id: user,
            count: 0
          });
        }
      }
    };
    fs.writeFileSync(path + threadID + '.json', JSON.stringify(newObj, null, 4));
  
  const threadData = JSON.parse(fs.readFileSync(path + threadID + '.json'));
  if (threadData.time != today) {
    global.client.sending_top = true;
    setTimeout(() => global.client.sending_top = false, 5 * 60 * 1000);
  }
  const userData_week_index = threadData.week.findIndex(e => e.id == senderID);
  const userData_day_index = threadData.day.findIndex(e => e.id == senderID);
  const userData_total_index = threadData.total.findIndex(e => e.id == senderID);
  if (userData_total_index == -1) {
    threadData.total.push({
      id: senderID,
      count: 1,
    });
  } else threadData.total[userData_total_index].count++;
  if (userData_week_index == -1) {
    threadData.week.push({
      id: senderID,
      count: 1
    });
  } else threadData.week[userData_week_index].count++;
  if (userData_day_index == -1) {
    threadData.day.push({
      id: senderID,
      count: 1
    });
  } else threadData.day[userData_day_index].count++;
  let p = event.participantIDs;
    if (!!p && p.length > 0) {
      p = p.map($=>$+'');
      ['day','week','total'].forEach(t=>threadData[t] = threadData[t].filter($=>p.includes($.id+'')));
    };
  fs.writeFileSync(path + threadID + '.json', JSON.stringify(threadData, null, 4));
  } catch(e){};
}

module.exports.run = async function({ api, event, args, Users, Threads }) {
  await new Promise(resolve => setTimeout(resolve, 500));
  const fs = global.nodemodule['fs-extra'];
  const { threadID, messageID, senderID, mentions } = event;
  let path_data = path + threadID + '.json';
  if (!fs.existsSync(path_data)) {
    return api.sendMessage("⚠️ Nhóm bạn chưa có dữ liệu tương tác!", threadID); // Thay đổi tin nhắn
  }
  const threadData = JSON.parse(fs.readFileSync(path_data));
  const query = args[0] ? args[0].toLowerCase() : '';

  if (query == 'box') {
    let body_ = event.args[0].replace(exports.config.name, '')+'box info';
    let args_ = body_.split(' ');
    
    arguments[0].args = args_.slice(1);
    arguments[0].event.args = args_;
    arguments[0].event.body = body_;
    
    return require('./box.js').run(...Object.values(arguments));
  } else if (query == 'reset') {
     let dataThread = (await Threads.getData(threadID)).threadInfo;
    if (!dataThread.adminIDs.some(item => item.id == senderID)) return api.sendMessage('❌ Bạn không đủ quyền hạn để sử dụng lệnh này!', event.threadID, event.messageID); // Thay đổi tin nhắn
     fs.unlinkSync(path_data);
     return api.sendMessage(`✅ Đã xóa toàn bộ dữ liệu đếm tương tác của nhóm thành công!`, event.threadID); // Thay đổi tin nhắn
     } else if(query == 'lọc') {
        let threadInfo = await api.getThreadInfo(threadID);
        if(!threadInfo.adminIDs.some(e => e.id == senderID)) return api.sendMessage("❌ Bạn không có quyền sử dụng lệnh này!", threadID); // Thay đổi tin nhắn
        if(!threadInfo.isGroup) return api.sendMessage("❌ Chỉ có thể sử dụng trong nhóm!", threadID); // Thay đổi tin nhắn
        if(!threadInfo.adminIDs.some(e => e.id == api.getCurrentUserID())) return api.sendMessage("⚠️ Bot cần quyền Quản Trị Viên để thực hiện chức năng này!", threadID); // Thay đổi tin nhắn
        if(!args[1] || isNaN(args[1])) return api.sendMessage("❓ Vui lòng nhập số tin nhắn tối thiểu để lọc!", threadID); // Thay đổi tin nhắn
        let minCount = +args[1],
            allUser = event.participantIDs;let id_rm = [];
        for(let user of allUser) {
            if(user == api.getCurrentUserID()) continue;
            if(!threadData.total.some(e => e.id == user) || threadData.total.find(e => e.id == user).count <= minCount) {
                await new Promise(resolve=>setTimeout(async () => {
                    await api.removeUserFromGroup(user, threadID);
                    id_rm.push(user);
                    resolve(true);
                }, 1000));
            }
        }
		return api.sendMessage(`✅ Đã xóa ${id_rm.length} thành viên với số tin nhắn dưới ${minCount}\n\n${id_rm.map(($,i)=>`${i+1}. ${global.data.userName.get($)}\n`).join('')}`, threadID); // Thay đổi tin nhắn
}

  ///////////////////small code////////////////////////////////
  var x = threadData.total.sort((a, b) => b.count - a.count);
  var o = [];
  for (i = 0; i < x.length; i++) {
    o.push({
      rank: i + 1,
      id: x[i].id,
      count: x[i].count
    })
  }
  /////////////////////////////////////////////////////////////
  var header = '',
    body = '',
    footer = '',
    msg = '',
    count = 1,
    storage = [],
    data = 0;
  if (query == 'all' || query == '-a') {
    header = '📊 TRẠNG THÁI TƯƠNG TÁC: TOÀN BỘ 📊\n━━━━━━━━━━━━━━━━━━━━━━\n'; // Header mới
    data = threadData.total;

  } else if (query == 'week' || query == '-w') {
    header = '📈 TRẠNG THÁI TƯƠNG TÁC: TUẦN NÀY 📈\n━━━━━━━━━━━━━━━━━━━━━━\n'; // Header mới
    data = threadData.week;
  } else if (query == 'day' || query == '-d') {
    header = '☀️ TRẠNG THÁI TƯƠNG TÁC: HÔM NAY ☀️\n━━━━━━━━━━━━━━━━━━━━━━\n'; // Header mới
    data = threadData.day;
  } else {
    // Mặc định là check tổng nếu không có query
    header = '📊 TRẠNG THÁI TƯƠNG TÁC: TOÀN BỘ 📊\n━━━━━━━━━━━━━━━━━━━━━━\n';
    data = threadData.total;
  }
  for (const item of data) {
    const userName = await Users.getNameUser(item.id) || 'Người dùng Facebook'; // Đổi tên mặc định
    const itemToPush = item;
    itemToPush.name = userName;
    storage.push(itemToPush);
  };
  let check = ['all', '-a', 'week', '-w', 'day', '-d'].some(e => e == query);
  if (!check && Object.keys(mentions).length > 0) {
    // Logic này không thay đổi
  }
  //sort by count from high to low if equal sort by name
  storage.sort((a, b) => {
    if (a.count > b.count) {
      return -1;
    }
    else if (a.count < b.count) {
      return 1;
    } else {
      return a.name.localeCompare(b.name);
    }
  });

if ((!check && Object.keys(mentions).length == 0) || (!check && Object.keys(mentions).length == 1) || (!check && event.type == 'message_reply')) {
        const UID = event.messageReply ? event.messageReply.senderID : Object.keys(mentions)[0] ? Object.keys(mentions)[0] : senderID;
        // Sử dụng UID đã xác định, không cần tạo biến uid mới
        const userRank = storage.findIndex(e => e.id == UID);
        const userTotal = threadData.total.find(e => e.id == UID) ? threadData.total.find(e => e.id == UID).count : 0;
        const userTotalWeek = threadData.week.find(e => e.id == UID) ? threadData.week.find(e => e.id == UID).count : 0;
        const userRankWeek = threadData.week.sort((a, b) => b.count - a.count).findIndex(e => e.id == UID);
        const userTotalDay = threadData.day.find(e => e.id == UID) ? threadData.day.find(e => e.id == UID).count : 0;
        const userRankDay = threadData.day.sort((a, b) => b.count - a.count).findIndex(e => e.id == UID); // Sửa lỗi ở đây, phải dùng threadData.day
        
        let count_day_last = threadData.last?.day?.find($=>$.id==UID)?.count||0;
        let count_week_last = threadData.last?.week?.find($=>$.id==UID)?.count||0;
        // Tỉ lệ tương tác không cần tính phức tạp như vậy, chỉ cần hiển thị số tin nhắn
        
        const nameUID = storage[userRank]?.name || 'Người dùng Facebook'; // Thêm optional chaining
        let threadInfo = await api.getThreadInfo(event.threadID);
        nameThread = threadInfo.threadName;
        var permission;
        if (global.config.ADMINBOT.includes(UID)) permission = `👑 Admin Bot`; // Thêm emoji
        else if (global.config.NDH.includes(UID)) permission = `💎 Người Thuê Bot`; // Thêm emoji
        else if (threadInfo.adminIDs.some(i => i.id == UID)) permission = `⚙️ Quản Trị Viên`; // Thêm emoji
        else permission = `👤 Thành Viên`; // Thêm emoji
        
        const target = UID == senderID ? 'Bạn' : nameUID;
        var storageDay = [];
        var storageWeek = [];
        var storageTotal = [];
        for (const item of threadData.day) {
            storageDay.push(item);
        }
        for (const item of threadData.week) {
            storageWeek.push(item);
        }
        for (const item of threadData.total) {
            storageTotal.push(item);
        }
        footer = `${storageDay.reduce((a, b) => a + b.count, 0)}`;
        footer1 = `${storageWeek.reduce((a, b) => a + b.count, 0)}`;
        footer2 = `${storageTotal.reduce((a, b) => a + b.count, 0)}`;
        
        if (userRank == -1) {
            return api.sendMessage(`⚠️ ${target} chưa có dữ liệu tương tác trong nhóm này!`, threadID); // Thay đổi tin nhắn
        }

        body += `✨ THÔNG TIN TƯƠNG TÁC CỦA ${target.toUpperCase()} ✨\n━━━━━━━━━━━━━━━━━━━━━━\n` + // Header mới
                `👤 Tên: ${nameUID}\n` +
                `🎖️ Chức vụ: ${permission}\n` +
                `🌐 Profile: fb.com/${UID}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🗓️ HÔM NAY:\n` +
                `💬 Tin nhắn: ${userTotalDay.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n` +
                `🥇 Hạng: ${userRankDay + 1}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🗓️ TUẦN NÀY:\n` +
                `💬 Tin nhắn: ${userTotalWeek.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n` +
                `🥈 Hạng: ${userRankWeek + 1}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `🗓️ TỔNG CỘNG:\n` +
                `💬 Tin nhắn: ${userTotal.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n` +
                `🏆 Hạng: ${userRank + 1}\n` +
                `━━━━━━━━━━━━━━━━━━━━━━\n` +
                `📌 Tổng tin nhắn của nhóm: ${footer2.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n` + // Báo tổng tin nhắn cả nhóm
                `✨ Cảm ơn bạn đã hoạt động tích cực trong ${nameThread}! ✨`; // Footer đẹp hơn
  } else {
    // Khi check all/week/day theo danh sách
    body = storage.map(item => {
            return `[${count++}] ${item.name} - ${item.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} tin nhắn`; // Thêm [] và định dạng số
        }).join('\n');
        footer = `\n━━━━━━━━━━━━━━━━━━━━━━\n💬 Tổng tin nhắn trong ${query === 'all' || query === '-a' ? 'toàn bộ' : query === 'week' || query === '-w' ? 'tuần này' : 'hôm nay'}: ${storage.reduce((a, b) => a + b.count, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}\n`; // Footer rõ ràng hơn
  }

  msg = `${header}${body}`;
  return api.sendMessage(msg + '\n' + // Thêm xuống dòng cho đẹp
    `${query == 'all' || query == '-a' ? `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `➡️ Bạn hiện đang đứng ở hạng: ${o.findIndex(id => id.id == senderID) + 1}\n\n` + // Sửa lại cách lấy hạng và thêm emoji/ký tự
    `📝 Hướng dẫn:\n` +
    `   - Phản hồi (reply) tin nhắn này kèm số thứ tự để xóa thành viên ra khỏi nhóm.\n` +
    `   - Sử dụng lệnh '${global.config.PREFIX}check lọc [số tin nhắn]' để xóa thành viên có số tin nhắn dưới mức quy định.\n` +
    `   - Sử dụng lệnh '${global.config.PREFIX}check reset' để xóa toàn bộ dữ liệu tin nhắn của nhóm.\n` +
    `   - Sử dụng lệnh '${global.config.PREFIX}check box' để xem thông tin chi tiết của nhóm.\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` : ""}`, threadID, (error, info) => {

    if (error) return console.log(error)
    if (query == 'all' || query == '-a') {
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        tag: 'locmen',
        thread: threadID,
        author: senderID, storage,
      })
    }
    global.client.handleReaction.push({
      name: this.config.name,
      messageID: info.messageID,
      sid: senderID,
    })
  });
  // Dọn dẹp biến không cần thiết
  threadData = storage = null;
}

module.exports.handleReply = async function({
  api, event, args, handleReply, client, __GLOBAL, permssion, Threads, Users, Currencies
}) {
  try {
    const { senderID } = event
    let dataThread = (await Threads.getData(event.threadID)).threadInfo;
    if (!dataThread.adminIDs.some(item => item.id == api.getCurrentUserID())) return api.sendMessage('❎ Bot cần quyền quản trị viên để thực hiện chức năng này!', event.threadID, event.messageID); // Thay đổi tin nhắn
    if (!dataThread.adminIDs.some(item => item.id == senderID)) return api.sendMessage('❎ Bạn không đủ quyền hạn để lọc thành viên!', event.threadID, event.messageID); // Thay đổi tin nhắn
    const fs = require('fs')
    
    let split = event.body.split(" ")

    if (isNaN(split.join(''))) return api.sendMessage(`⚠️ Dữ liệu không hợp lệ! Vui lòng chỉ nhập số thứ tự.`, event.threadID); // Thay đổi tin nhắn

    let msg = [], count_err_rm = 0;
    for (let $ of split) {
      let id = handleReply?.storage[$ - 1]?.id;

      if (!!id)try {
        await api.removeUserFromGroup(id, event.threadID);
        msg.push(`✅ ${$}. ${global.data.userName.get(id)}\n`) // Thêm dấu tích xanh
      } catch (e) {++count_err_rm;continue};
    };

    api.sendMessage(`✅ Đã xóa ${split.length-count_err_rm} người dùng thành công!\n` +
                   `${count_err_rm > 0 ? `❌ Thất bại ${count_err_rm} người dùng (có thể do lỗi hoặc không đủ quyền).\n\n` : '\n'}` +
                   `${msg.join('')}`, handleReply.thread); // Thay đổi tin nhắn và định dạng
  } catch (e) {
    console.log(e);
    api.sendMessage("Đã xảy ra lỗi trong quá trình xử lý phản hồi!", event.threadID, event.messageID); // Thêm tin nhắn lỗi chung
  }
}

module.exports.handleReaction = function({ event, Users, Threads, api, handleReaction: _, Currencies }) {
  const fs = require('fs')
  if (event.userID != _.sid) return;
  if (event.reaction != "❤") return; 
  api.unsendMessage(_.messageID)
  let data = JSON.parse(fs.readFileSync(`${path}${event.threadID}.json`));
  let sort = data.total.sort((a, b) => a.count < b.count ? 0 : -1); // sort lại cho đúng thứ tự giảm dần
  
  // Tạo message hiển thị toàn bộ thành viên
  const fullListBody = sort.map(($, i) => `${i + 1}. ${global.data.userName.get($.id)} - ${$.count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} tin nhắn.`).join('\n'); // Định dạng số và thêm tin nhắn
  const totalMessages = data.total.reduce((s, $) => s + $.count, 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const userRank = sort.findIndex($ => $.id == event.userID) + 1; // Hạng của người dùng
  
  api.sendMessage(
    `✨ THỐNG KÊ TƯƠNG TÁC TOÀN BỘ NHÓM ✨\n━━━━━━━━━━━━━━━━━━━━━━\n` +
    `${fullListBody}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💬 Tổng tin nhắn nhóm: ${totalMessages}\n` +
    `📊 Bạn hiện đang đứng ở hạng: ${userRank}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📝 Hướng dẫn:\n` +
    `   - Phản hồi (reply) tin nhắn này kèm số thứ tự để xóa thành viên ra khỏi nhóm (thêm dấu cách nếu muốn xoá nhiều thành viên).\n` +
    `   - Sử dụng lệnh '${global.config.PREFIX}check lọc [số tin nhắn]' để xóa thành viên có số tin nhắn dưới mức quy định.\n` +
    `   - Sử dụng lệnh '${global.config.PREFIX}check reset' để xóa toàn bộ dữ liệu tin nhắn.\n` +
    `   - Sử dụng lệnh '${global.config.PREFIX}check box' để xem thông tin nhóm.`,
    event.threadID, (err, info) => global.client.handleReply.push({
      name: this.config.name,
      messageID: info.messageID,
      tag: 'locmen',
      thread: event.threadID,
      author: event.senderID,
      storage: sort,
    })
  );
}
