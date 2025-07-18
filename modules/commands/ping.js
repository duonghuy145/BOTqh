module.exports.config = {
  name: "ping",
  version: "1.1.0", // Tăng version để dễ quản lý
  hasPermssion: 1, // Chỉ QTV nhóm trở lên mới dùng được
  credits: "Mirai Team (mod bởi Xám)", // Ghi nhận công sức mod
  description: "Gắn thẻ (tag) toàn bộ thành viên trong nhóm kèm thông báo.",
  commandCategory: "Quản Trị Viên",
  usages: "[Tin nhắn muốn tag]", // Hướng dẫn sử dụng rõ ràng
  cooldowns: 10 // Tăng cooldown để tránh spam
};

module.exports.run = async function({ api, event, args, Users }) {
  try {
      const threadID = event.threadID;
      const messageID = event.messageID;
      const botID = api.getCurrentUserID();
      const senderID = event.senderID;

      // Lấy danh sách thành viên trong nhóm (trừ bot và người gửi lệnh)
      const participantIDs = event.participantIDs;
      const listUserID = participantIDs.filter(ID => ID != botID && ID != senderID);

      // Lấy tên người gửi lệnh
      const senderName = (global.data.userName.get(senderID)) ? global.data.userName.get(senderID) : await Users.getNameUser(senderID);

      // Tạo nội dung tin nhắn
      // Nếu không có args, mặc định là thông báo chung chung
      // Thêm các icon để tin nhắn sinh động hơn
      let bodyMessage = args.length > 0 ? args.join(" ") : "📣 Thông báo từ Admin:\n";

      // Thay thế placeholder {name} bằng tên người gửi nếu có
      bodyMessage = bodyMessage.replace(/\{name\}/g, senderName);

      // Chuẩn bị mentions (gắn thẻ)
      let mentions = [];
      let index = 0;
      for (const idUser of listUserID) {
          bodyMessage += ` @${idUser}`; // Thêm tag vào body tin nhắn (chỉ là placeholder)
          mentions.push({ id: idUser, tag: "‎", fromIndex: index - 1 }); // Từ index - 1 vì " @ " có 3 ký tự
          index -= 1; // Giảm index để tag đúng vị trí
      }

      // Kiểm tra nếu danh sách tag quá dài, gửi nhiều tin nhắn
      const chunkSize = 20; // Số lượng người tag mỗi lần gửi
      for (let i = 0; i < listUserID.length; i += chunkSize) {
          const chunk = listUserID.slice(i, i + chunkSize);
          let chunkBody = bodyMessage;
          let chunkMentions = [];
          let currentBody = "";
          let currentIndex = 0;

          for (const idUser of chunk) {
              const userName = global.data.userName.get(idUser) || (await Users.getNameUser(idUser));
              const tagText = `@${userName}`;
              currentBody += `${tagText} `;
              chunkMentions.push({
                  tag: userName,
                  id: idUser,
                  fromIndex: currentIndex
              });
              currentIndex += tagText.length + 1; // +1 cho khoảng trắng
          }

          // Nếu có nội dung tin nhắn ban đầu, thêm vào đầu mỗi chunk
          if (args.length > 0) {
               await api.sendMessage({ body: `${bodyMessage}\n${currentBody}`, mentions: chunkMentions }, threadID);
          } else {
               await api.sendMessage({ body: `📣 Thông báo từ Admin:\n${currentBody}`, mentions: chunkMentions }, threadID);
          }
      }

      // Nếu không có ai để tag (chỉ có bot và người gửi)
      if (listUserID.length === 0) {
          return api.sendMessage("😔 Không có ai để gắn thẻ trong nhóm này ngoài bạn và bot.", threadID, messageID);
      }

  } catch (e) {
      console.error("Lỗi khi thực thi lệnh ping:", e);
      api.sendMessage("Đã xảy ra lỗi không mong muốn khi thực thi lệnh ping. Vui lòng thử lại sau!", event.threadID, event.messageID);
  }
};