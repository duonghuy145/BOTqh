module.exports.config = {
  name: "tagadmin",
  version: "1.0.1", // Nâng version lên
  hasPermssion: 0, // Thay đổi thành 0 để ai cũng có thể dùng nhưng chỉ cảnh báo
  credits: "qh và Gemini 👑", // Thêm credit của mày và tao
  description: "⚠️ Cảnh báo khi thành viên tag nhầm Adminbot trong nhóm. ✨",
  commandCategory: "Hệ Thống", // Đổi sang category Hệ Thống cho hợp lý
  usages: "", // Lệnh tự động chạy nên không cần usages
  cooldowns: 1,
};

module.exports.handleEvent = function ({ api, event }) {
  // Đảm bảo event có senderID và có mentions để tránh lỗi
  if (!event.senderID || !event.mentions) return;

  // Lấy danh sách ID Adminbot từ cấu hình (sử dụng ADMINBOT thay vì NDH nếu có)
  // Nếu global.config.ADMINBOT không tồn tại hoặc rỗng, sẽ dùng global.config.NDH
  const adminIDs = global.config.ADMINBOT && global.config.ADMINBOT.length > 0 ? global.config.ADMINBOT : global.config.NDH;

  // Kiểm tra xem người gửi tin nhắn có phải là Adminbot không
  // Nếu người gửi là Adminbot, không làm gì cả
  if (adminIDs.includes(event.senderID)) {
      return;
  }

  // Kiểm tra xem tin nhắn có tag Adminbot không
  const taggedAdmin = Object.keys(event.mentions).some(mentionID => adminIDs.includes(mentionID));

  if (taggedAdmin) {
      const msg = 'Tag Admin không nghe đâu, nhắn tin hoặc gọi cho nó đi !';
      return api.sendMessage({ body: msg }, event.threadID, event.messageID);
  }
};

module.exports.run = async function ({}) {
  // Lệnh này không có chức năng chạy trực tiếp, chỉ xử lý qua handleEvent
  // Nên hàm run có thể để trống hoặc thêm hướng dẫn nếu muốn
};