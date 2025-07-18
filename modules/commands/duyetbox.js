module.exports.config = {
  name: "duyetbox",
  version: "1.0.1", // Tăng version sau khi mod
  hasPermssion: 1, // Quyền admin nhóm
  credits: "Thiệu Trung Kiên - modded by qh and Gemini ✨", // Thêm credit qh và Gemini
  description: "Duyệt thành viên đang chờ phê duyệt vào nhóm 👥",
  commandCategory: "Quản Trị Viên 👑",
  usages: "duyetbox",
  cooldowns: 5 // Thêm cooldown để tránh spam
};

module.exports.run = async function({
  api,
  event,
  args,
  Users,
  Threads
}) {
  const {
      threadID,
      messageID
  } = event;

  // Lấy thông tin nhóm
  const threadInfo = await api.getThreadInfo(threadID);
  const botID = api.getCurrentUserID();

  // Kiểm tra bot có quyền quản trị viên trong nhóm hay không
  // api.getThreadInfo trả về adminIDs là một mảng các đối tượng { id: '...', admin: true/false }
  const isBotAdmin = threadInfo.adminIDs.some(admin => admin.id === botID && admin.admin === true);

  if (!isBotAdmin) {
      return api.sendMessage(
          "⚠️ Bot cần quyền quản trị viên nhóm để có thể duyệt thành viên. Vui lòng cấp quyền và thử lại nha! 🤖",
          threadID,
          messageID
      );
  }

  const approvalQueue = threadInfo.approvalQueue;

  if (!approvalQueue || approvalQueue.length === 0) {
      return api.sendMessage("🎉 Hiện không có thành viên nào đang chờ phê duyệt vào nhóm cả! Nhóm bạn thật tuyệt vời! ✨", threadID, messageID);
  }

  let message = "📝 **DANH SÁCH THÀNH VIÊN CHỜ DUYỆT:** 📝\n━━━━━━━━━━━━━━━━━━\n";
  for (let i = 0; i < approvalQueue.length; i++) {
      const userInfo = await Users.getNameUser(approvalQueue[i].requesterID);
      message += `[${i + 1}]. ${userInfo} - (UID: ${approvalQueue[i].requesterID})\n`;
  }

  message += "\n━━━━━━━━━━━━━━━━━━\n👉 **Hãy trả lời tin nhắn này với số thứ tự của thành viên bạn muốn duyệt vào nhóm nhé!**";

  api.sendMessage(message, threadID, (err, info) => {
      if (err) {
          console.error("Lỗi khi gửi danh sách duyệtbox:", err);
          return api.sendMessage("❌ Đã xảy ra lỗi khi tạo danh sách duyệt thành viên. Vui lòng thử lại sau.", threadID, messageID);
      }
      global.client.handleReply.push({
          name: this.config.name,
          author: event.senderID,
          messageID: info.messageID,
          type: "duyetbox" // Đổi type để rõ ràng hơn
      });
  }, messageID);
};

module.exports.handleReply = async function({
  api,
  args,
  Users,
  handleReply,
  event,
  Threads
}) {
  const {
      threadID,
      messageID,
      body
  } = event;

  if (handleReply.type === "duyetbox") {
      const threadInfo = await api.getThreadInfo(threadID);
      const approvalQueue = threadInfo.approvalQueue;

      const choice = parseInt(body);

      if (isNaN(choice) || choice < 1 || choice > approvalQueue.length) {
          return api.sendMessage("❗ Lựa chọn không hợp lệ. Vui lòng trả lời bằng số thứ tự của thành viên muốn duyệt nhé!", threadID, messageID);
      }

      const targetUserID = approvalQueue[choice - 1].requesterID;
      const targetUserName = await Users.getNameUser(targetUserID);

      try {
          await api.addUserToGroup(targetUserID, threadID);
          api.sendMessage(`✅ Đã duyệt thành công thành viên **${targetUserName}** (UID: ${targetUserID}) vào nhóm! Chào mừng bạn mới! 🎉`, threadID, () => api.unsendMessage(handleReply.messageID));
      } catch (error) {
          console.error("Lỗi khi duyệt thành viên:", error);
          api.sendMessage(`❌ Rất tiếc, không thể duyệt thành viên **${targetUserName}** vào nhóm được. Có thể người này đã vào hoặc bot không đủ quyền. 😥`, threadID, messageID);
      }
  }
};