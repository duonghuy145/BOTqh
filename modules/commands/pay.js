module.exports.config = {
  name: "pay",
  version: "1.0.2", // Nâng cấp version
  hasPermssion: 0,
  credits: "Mirai Team, Tiến, qh và Gemini", // Thêm credit của mày và tao
  description: "Chuyển tiền cho người khác trong nhóm. 💸", // Mô tả ngắn gọn, có icon
  commandCategory: "tiện ích", // Chuyển sang chữ thường
  usages: "[số tiền] [@tag/reply]", // Rút gọn và rõ ràng hơn
  cooldowns: 5,
};

module.exports.run = async ({ event, api, Currencies, args, Users }) => {
  const { threadID, messageID, senderID, messageReply, mentions } = event;

  try {
      const targetID = messageReply ? messageReply.senderID : Object.keys(mentions)[0];
      const amount = args[0] === 'all' ? (await Currencies.getData(senderID)).money : BigInt(args[0]);

      // Kiểm tra targetID
      if (!targetID) {
          return api.sendMessage(`⚠️ Cú pháp sai rồi! Bạn cần tag hoặc reply người muốn chuyển tiền. \nVí dụ: ${global.config.PREFIX}${this.config.name} 100 @[tên người đó]`, threadID, messageID);
      }

      // Kiểm tra số tiền
      if (isNaN(String(amount)) || amount <= 0n) {
          return api.sendMessage(`⚠️ Số tiền chuyển phải là một con số hợp lệ và lớn hơn 0. Vui lòng kiểm tra lại! `, threadID, messageID);
      }

      // Lấy số dư của người gửi
      const senderBalance = (await Currencies.getData(senderID)).money;

      // Kiểm tra số dư
      if (amount > senderBalance) {
          return api.sendMessage(`💰 Không đủ tiền! Số dư của bạn hiện tại là ${formatNumber(senderBalance)} VND. `, threadID, messageID);
      }

      // Lấy tên người nhận
      const targetName = await Users.getNameUser(targetID);

      // Chuyển tiền
      await Currencies.increaseMoney(targetID, String(amount));
      await Currencies.decreaseMoney(senderID, String(amount));

      return api.sendMessage(
          `✅ Đã chuyển thành công ${formatNumber(amount)} VND cho ${targetName}. Chúc mừng! 🎉`,
          threadID,
          messageID
      );

  } catch (e) {
      console.error("Lỗi khi thực hiện lệnh pay:", e);
      return api.sendMessage("⚠️ Đã có sự cố xảy ra khi thực hiện giao dịch. Vui lòng thử lại sau! ", threadID, messageID);
  }
};

// Hàm định dạng số tiền
function formatNumber(number) {
  if (typeof number === 'bigint') { // Xử lý BigInt
      return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }
  return number.toLocaleString('vi-VN'); // Dùng localeString cho số thường
}