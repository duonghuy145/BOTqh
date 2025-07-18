module.exports.config = { // Sửa 'this.config' thành 'module.exports.config'
  name: "contact",
  version: "1.0.1", // Nâng version lên xíu ⬆️
  hasPermssion: 0,
  credits: "DongDev, modded by qh and Gemini ✨", // Kí tên chung cho ngầu 😎
  description: "chia sẻ contact của thành viên trong nhóm 📞", // Chữ thường, viết hoa đầu dòng + icon
  commandCategory: "tiện ích 🛠️", // Chữ thường, viết hoa đầu dòng + icon
  usages: "[reply/tag/id]", // Gợi ý cách dùng đa dạng hơn
  cooldowns: 5
};

module.exports.run = async ({ api, event, args, global }) => { // Sửa 'this.run' thành 'module.exports.run' và thêm 'global' vào destructuring
  const { shareContact } = api;
  const { threadID, messageReply, senderID, mentions, type } = event;

  let targetID;

  // Ưu tiên reply
  if (type === "message_reply") {
      targetID = messageReply.senderID;
  } 
  // Sau đó đến tag
  else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0].replace(/&mibextid=\w+/g, ''); // Fix regex cho tổng quát hơn
  } 
  // Tiếp đến là ID nếu có trong args
  else if (args[0] && !isNaN(args[0])) {
      targetID = args[0];
  }
  // Cuối cùng, nếu không có gì, lấy ID của người gửi lệnh
  else {
      targetID = senderID;
  }

  // Nếu người dùng nhập tên mà không tag/reply, thử tìm UID
  // Cần có global.utils.getUID nếu muốn dùng tính năng này
  if (!targetID && args[0]) {
      try {
          targetID = await global.utils.getUID(args.join(" "));
      } catch (error) {
          console.error("Lỗi khi tìm UID từ tên:", error);
          return api.sendMessage("Không tìm thấy người dùng này hoặc có lỗi xảy ra. Vui lòng reply, tag hoặc cung cấp ID chính xác nhé! ⚠️", threadID); // Chữ thường, viết hoa đầu dòng + icon
      }
  }

  // Kiểm tra nếu không tìm thấy targetID cuối cùng
  if (!targetID) {
      return api.sendMessage("Không thể xác định đối tượng để chia sẻ contact. Vui lòng reply tin nhắn, tag người bạn muốn, hoặc nhập ID của họ nhé! 🤔", threadID); // Chữ thường, viết hoa đầu dòng + icon
  }

  // Gửi contact
  shareContact("", targetID, threadID); // Nội dung tin nhắn rỗng, chỉ gửi contact
  api.sendMessage(`Đã chia sẻ contact của ${targetID} cho bạn. 📬`, threadID); // Thêm tin nhắn thông báo
};