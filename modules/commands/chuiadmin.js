module.exports.config = {
  name: "chuiadmin",
  version: "1.0.1", // Cập nhật version để đánh dấu bản mod
  hasPermssion: 2, // Chỉ Admin Bot (hasPermssion: 2) mới có quyền sử dụng/quản lý
  credits: "ManhG (Đã điều chỉnh bởi qh và Gemini) 👑", // Cập nhật credit
  description: "🚫 Tự động cấm người dùng xúc phạm Admin Bot hoặc bot. Cho phép Admin Bot tương tác để gỡ cấm.",
  commandCategory: "AdminBot", // Đổi sang AdminBot
  usages: "[reply tin nhắn bị ban]", // Chỉ Admin Bot mới dùng để tương tác
  cooldowns: 5,
  dependencies: {
      "moment-timezone": ""
  }
};

module.exports.handleReply = async function ({ api, event, handleReply, Users }) {
  const { threadID, messageID, senderID, body } = event;
  const { type, author: uidUser, nameU, id: originalThreadID, messID: originalMessageID, currentReason } = handleReply;

  const adminName = await Users.getNameUser(senderID);

  switch (type) {
      case "reply": { // Admin Bot phản hồi lại tin nhắn xin ân xá của người dùng bị ban
          if (!global.config.ADMINBOT.includes(senderID)) {
              return api.sendMessage("❌ Bạn không có quyền phản hồi tin nhắn này.", threadID, messageID);
          }
          // Gửi phản hồi của Admin đến người dùng bị ban
          api.sendMessage({ 
              body: `📝 Phản hồi từ Quản trị viên ${adminName}:\n\n"${body}"\n\n💬 Để tiếp tục gửi lời ân xá, vui lòng phản hồi tin nhắn này.`,
              mentions: [{ tag: adminName, id: senderID }]
          }, uidUser, (e, data) => {
              if (e) {
                  console.error("❌ Lỗi khi gửi phản hồi Admin đến người dùng:", e);
                  return api.sendMessage("❌ Đã xảy ra lỗi khi gửi phản hồi đến người dùng.", threadID, messageID);
              }
              global.client.handleReply.push({
                  name: this.config.name,
                  messageID: data.messageID,
                  messID: originalMessageID,
                  author: senderID, // Admin Bot
                  id: originalThreadID, // Thread của người bị ban
                  nameU: nameU, // Tên người bị ban
                  type: "banU", // Chờ Admin Bot quyết định gỡ ban hay không
                  currentReason: currentReason // Lý do bị ban
              });
          }, originalMessageID);
          break;
      }

      case "banU": { // Admin Bot quyết định gỡ ban hoặc tiếp tục phản hồi
          if (!global.config.ADMINBOT.includes(senderID)) {
              return api.sendMessage("❌ Bạn không có quyền thực hiện thao tác này.", threadID, messageID);
          }
          const args = body.split(" ");
          if (args[0].toLowerCase() === "unban") {
              let userData = (await Users.getData(uidUser)).data || {};
              userData.banned = 0;
              userData.reason = null;
              userData.dateAdded = null;
              await Users.setData(uidUser, { data: userData });
              global.data.userBanned.delete(uidUser); // Xóa khỏi danh sách ban toàn cầu

              api.sendMessage(`✅ Người dùng ${nameU} (UID: ${uidUser}) đã được gỡ cấm thành công bởi Quản trị viên ${adminName}.`, threadID, messageID);
              api.sendMessage(`🎉 Thông báo: Bạn (${nameU}) đã được gỡ cấm khỏi hệ thống bot bởi Quản trị viên. Vui lòng không tái phạm hành vi vi phạm.`, uidUser);

              // Xóa handleReply sau khi đã xử lý xong
              const index = global.client.handleReply.findIndex(item => item.messageID == handleReply.messageID);
              if (index !== -1) global.client.handleReply.splice(index, 1);

          } else {
              // Admin Bot muốn phản hồi tiếp mà không gỡ ban
              api.sendMessage({ 
                  body: `📝 Phản hồi từ Quản trị viên ${adminName}:\n\n"${body}"\n\n💬 Để tiếp tục gửi lời ân xá, vui lòng phản hồi tin nhắn này.`, 
                  mentions: [{ tag: adminName, id: senderID }] 
              }, uidUser, (e, data) => {
                  if (e) {
                      console.error("❌ Lỗi khi gửi phản hồi Admin đến người dùng (tiếp theo):", e);
                      return api.sendMessage("❌ Đã xảy ra lỗi khi gửi phản hồi đến người dùng.", threadID, messageID);
                  }
                  global.client.handleReply.push({
                      name: this.config.name,
                      messageID: data.messageID,
                      messID: originalMessageID,
                      author: senderID,
                      id: originalThreadID,
                      nameU: nameU,
                      type: "banU",
                      currentReason: currentReason
                  });
              }, originalMessageID);
          }
          break;
      }
  }
};

module.exports.handleEvent = async ({ event, api, Users, Threads }) => {
  const { threadID, messageID, body, senderID } = event;
  const moment = require("moment-timezone");
  const time = moment.tz("Asia/Ho_Chi_minh").format("HH:mm:ss DD/MM/YYYY");

  // Bỏ qua nếu là tin nhắn từ bot hoặc không phải tin nhắn văn bản
  if (senderID === api.getCurrentUserID() || !body) return;

  // Bỏ qua nếu người gửi là Admin Bot
  if (global.config.ADMINBOT.includes(senderID)) return;

  const name = await Users.getNameUser(senderID);
  const threadInfo = await api.getThreadInfo(threadID);
  const threadName = threadInfo.threadName || "Không có tên";

  // Danh sách các từ cấm
  const bannedKeywords = [
      "admin lol", "admin lồn", "admin gà", "con admin lol", "admin ngu lol", "admin chó",
      "dm admin", "đm admin", "dmm admin", "đmm admin", "đb admin", "admin điên", "admin dở",
      "admin khùng", "đĩ admin", "admin paylac rồi", "con admin lòn", "cmm admin", "clap admin",
      "admin ncc", "admin oc", "admin óc", "admin óc chó", "cc admin", "admin tiki", "lozz admintt",
      "lol admin", "loz admin", "lồn admin", "admin lồn", "admin lon", "admin cac", "admin nhu lon",
      "admin như cc", "admin như bìu", "admin sida", "admin fake", "bằng ngu", "admin shoppee", "admin đểu", "admin dỡm"
  ];

  const lowerCaseBody = body.toLowerCase();
  let matchedKeyword = null;

  // Kiểm tra xem nội dung tin nhắn có chứa từ cấm không
  for (const keyword of bannedKeywords) {
      if (lowerCaseBody.includes(keyword)) {
          matchedKeyword = keyword;
          break;
      }
  }

  if (matchedKeyword) {
      console.log(`[AUTOBAN] \nNgười dùng ${name} (UID: ${senderID}) đã chửi admin/bot: "${matchedKeyword}" tại nhóm "${threadName}" (${threadID})`);

      let userData = (await Users.getData(senderID)).data || {};
      userData.banned = 1;
      userData.reason = matchedKeyword;
      userData.dateAdded = time;
      await Users.setData(senderID, { data: userData });
      global.data.userBanned.set(senderID, { reason: userData.reason, dateAdded: userData.dateAdded }); // Cập nhật global data

      // Thông báo cho người dùng bị ban
      api.sendMessage(
          `🚫 [TỰ ĐỘNG CẤM] \nBạn (${name}) đã bị cấm sử dụng bot vĩnh viễn vì hành vi xúc phạm Quản trị viên/bot ("${matchedKeyword}").\n\nĐể được ân xá, vui lòng phản hồi tin nhắn này với lời giải thích hoặc xin lỗi.`,
          senderID, // Gửi riêng cho người bị ban
          (err, info) => {
              if (err) {
                  console.error("❌ Lỗi khi gửi tin nhắn ban cho người dùng:", err);
                  api.sendMessage(`⚠️ Đã cấm ${name} nhưng không thể gửi thông báo trực tiếp.`, threadID, messageID);
              } else {
                  global.client.handleReply.push({
                      name: this.config.name,
                      messageID: info.messageID,
                      messID: messageID, // MessageID của tin nhắn gốc gây ban
                      author: senderID, // Người bị ban
                      id: threadID, // Thread mà họ bị ban
                      nameU: name, // Tên người bị ban
                      type: "reply", // Chờ người dùng bị ban phản hồi
                      currentReason: matchedKeyword // Lý do bị ban
                  });
              }
          }
      );

      // Thông báo cho Admin Bot
      const adminIDs = global.config.ADMINBOT;
      for (const adminID of adminIDs) {
          api.sendMessage(
              `🚨 [THÔNG BÁO AUTOBAN]
Người dùng: ${name} (UID: ${senderID})
Tại nhóm: ${threadName} (ID: ${threadID})
Lý do bị cấm: Xúc phạm Quản trị viên/bot ("${matchedKeyword}")
Thời gian: ${time}

Để phản hồi hoặc gỡ cấm, vui lòng phản hồi tin nhắn gốc của người dùng bị ban (tin nhắn mà bot gửi báo cấm họ, không phải tin nhắn này).`,
              adminID,
              (error, info) => {
                  if (error) console.error(`❌ Lỗi khi gửi thông báo autoban cho Admin ${adminID}:`, error);
              }
          );
      }

      // Gửi tin nhắn thông báo ban trong nhóm (tùy chọn, để nhóm biết)
      api.sendMessage(`🚫 [HỆ THỐNG] Người dùng ${name} đã bị cấm sử dụng bot do vi phạm quy định.`, threadID, messageID);
  }
};

// Hàm run này không còn dùng để bật/tắt autoban nữa, mà để hiển thị thông tin
module.exports.run = async function ({ api, event, Users, getText }) {
  const { threadID, messageID, senderID } = event;

  // Kiểm tra quyền của người dùng (chỉ Admin Bot mới được chạy lệnh này)
  if (!global.config.ADMINBOT.includes(senderID)) {
      return api.sendMessage("❌ Bạn không có quyền sử dụng lệnh này. Lệnh chỉ dành cho Quản trị viên Bot.", threadID, messageID);
  }

  const usageMessage = `💡 Lệnh này giúp tự động cấm người dùng xúc phạm Admin Bot hoặc bot.\n\nCách sử dụng:
  - Khi có người dùng bị cấm, họ sẽ nhận được thông báo và có thể phản hồi để xin ân xá.
  - Quản trị viên Bot sẽ nhận được thông báo về người bị cấm và có thể phản hồi tin nhắn xin ân xá của họ để tương tác.
  - Để gỡ cấm: Phản hồi tin nhắn của người dùng bị ban và nhập "unban".`;

  api.sendMessage(usageMessage, threadID, messageID);
};