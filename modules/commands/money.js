module.exports.config = {
  name: "money",
  version: "1.0.1", // Tăng version lên một chút
  hasPermssion: 0,
  credits: "qh và Gemini", // Thêm credit của mày và tao
  description: "Kiểm tra số dư tài khoản của bản thân, thành viên khác hoặc toàn bộ nhóm. 💰", // Mô tả mới, rõ ràng, có icon
  commandCategory: "tiện ích", // Đổi sang chữ thường, không phải "Kiếm Tiền" nữa cho phù hợp hơn
  usages: "money [all/@tag/reply]", // Thêm usage rõ ràng hơn
  cooldowns: 5, // Tăng cooldown để tránh spam
  usePrefix: true, // Đặt lại về true nếu muốn dùng prefix
};

module.exports.run = async function({ Currencies, api, event, Users }) {
  const { threadID, senderID, mentions, type, messageReply, body } = event;
  let targetID = senderID; // Mặc định là người gửi lệnh

  // Check nếu người dùng muốn xem tiền của tất cả thành viên trong nhóm
  if (body.toLowerCase().includes("all")) {
      try {
          const threadInfo = await api.getThreadInfo(threadID);
          const allMembers = threadInfo.participantIDs;
          let finalMessage = "💸 **Số dư của các thành viên trong nhóm:**\n\n"; // Tin nhắn mới, có icon, in đậm
          let membersMoney = [];

          for (const memberID of allMembers) {
              const name = await Users.getNameUser(memberID);
              const userData = await Currencies.getData(memberID);
              // Đảm bảo money là số hoặc 0 nếu không có
              const money = (userData && typeof userData.money !== 'undefined') ? userData.money : 0;
              membersMoney.push({ name, money });
          }

          // Sắp xếp theo số tiền giảm dần
          membersMoney.sort((a, b) => b.money - a.money);

          let rank = 1;
          for (const member of membersMoney) {
              // Kiểm tra và hiển thị "vô hạn" nếu cần
              if (member.money === Infinity) {
                  finalMessage += `${rank}. ${member.name} ➡️ Tiền: Vô hạn ♾️\n`; // Thêm icon vô hạn
              } else {
                  finalMessage += `${rank}. ${member.name} ➡️ Tiền: ${member.money.toLocaleString('vi-VN')} VND\n`; // Định dạng số tiền
              }
              rank++;
          }
          finalMessage += `\n✨ Bot của qh và Gemini ✨`; // Thêm watermark
          return api.sendMessage(finalMessage, threadID);
      } catch (error) {
          console.error(`Lỗi khi truy xuất tiền của tất cả thành viên:`, error);
          return api.sendMessage("⚠️ Rất tiếc! Đã có trục trặc khi lấy thông tin toàn bộ nhóm. Vui lòng thử lại sau nhé. ", threadID); // Thông báo lỗi mới
      }
  }

  // Check nếu người dùng muốn xem tiền của người được reply hoặc tag
  if (type === 'message_reply' && messageReply.senderID) {
      targetID = messageReply.senderID;
  } else if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0];
  }

  try {
      const name = await Users.getNameUser(targetID);
      const userData = await Currencies.getData(targetID);

      // Kiểm tra nếu không có dữ liệu tiền hoặc money là undefined
      if (!userData || typeof userData.money === 'undefined' || userData.money === null) {
          return api.sendMessage(`👤 ${name} hiện có: 0 VND. Tiêu hết rồi à? 🤔`, threadID); // Tin nhắn mới, có icon
      }

      const money = userData.money;

      // Xử lý trường hợp tiền vô hạn
      if (money === Infinity) {
          return api.sendMessage(`👑 ${name} có: Vô hạn tiền! Đúng là đại gia mà. ♾️`, threadID); // Tin nhắn mới, có icon
      }

      // Tin nhắn hiển thị số tiền cụ thể
      return api.sendMessage(`💵 ${name} hiện có: ${money.toLocaleString('vi-VN')} VND. Cố gắng tích lũy thêm nhé! `, threadID); // Tin nhắn mới, có icon, định dạng số tiền
  } catch (error) {
      console.error(`Lỗi khi truy xuất tiền của người dùng ${targetID}:`, error);
      return api.sendMessage("⚠️ Oops! Đã xảy ra sự cố khi kiểm tra số dư. Hãy thử lại sau ít phút nhé. ", threadID); // Thông báo lỗi mới
  }
};