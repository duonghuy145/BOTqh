module.exports.config = {
	name: "nhacnho",
	version: "1.0.0", // Nâng cấp version lên cho "mới mẻ"
	hasPermssion: 0,
	credits: "Mirai Team, qh và Gemini", // Thêm credit của mày và tao
	description: "Thiết lập lời nhắc nhở cá nhân sau một khoảng thời gian nhất định. ⏰", // Mô tả mới, rõ ràng, có icon
	commandCategory: "tiện ích", // Đổi sang chữ thường, hợp lý hơn
	usages: "[Thời gian (giây)] [Nội dung nhắc nhở]", // Hướng dẫn sử dụng rõ ràng hơn
	cooldowns: 5
};

module.exports.run = async function({ api, event, args, Users }) {
	const { threadID, messageID, senderID } = event;
	const inputTime = args[0]; // Thời gian nhập vào
	// Lấy toàn bộ phần còn lại làm nội dung nhắc nhở
	const reminderText = args.slice(1).join(" "); 

	// Kiểm tra xem thời gian có phải là số dương không
	if (isNaN(inputTime) || parseInt(inputTime) <= 0) {
			return api.sendMessage("⚠️ Oups! Thời gian bạn nhập không phải là một con số hợp lệ hoặc phải lớn hơn 0. Hãy thử lại nhé! ", threadID, messageID); // Thông báo lỗi mới, có icon cảnh báo
	}

	const timeInSeconds = parseInt(inputTime);
	// Chuyển đổi thời gian hiển thị cho dễ đọc (phút nếu lớn hơn 60 giây)
	const displayTime = timeInSeconds >= 60 ? `${Math.floor(timeInSeconds / 60)} phút ${timeInSeconds % 60 > 0 ? (timeInSeconds % 60) + ' giây' : ''}`.trim() : `${timeInSeconds} giây`;

	api.sendMessage(`⏳ Được rồi! Tôi sẽ nhắc bạn sau ${displayTime}. Hãy nhớ kiểm tra tin nhắn nhé! `, threadID, messageID); // Tin nhắn xác nhận mới, có icon

	// Chờ đợi khoảng thời gian đã định
	await new Promise(resolve => setTimeout(resolve, timeInSeconds * 1000));

	// Lấy tên người dùng để nhắc nhở
	let userName = (await Users.getData(senderID)).name; // Lấy tên từ Users API cho chuẩn
	// Fallback nếu không lấy được tên hoặc người dùng có biệt danh trong nhóm
	const threadInfo = await api.getThreadInfo(threadID);
	if (threadInfo.nicknames && threadInfo.nicknames[senderID]) {
			userName = threadInfo.nicknames[senderID];
	}

	// Gửi tin nhắn nhắc nhở
	let finalReminderMessage = "";
	if (reminderText) {
			finalReminderMessage = `🔔 ${userName} ơi, bạn đã hẹn tôi nhắc nhở về điều này: "${reminderText}"`; // Tin nhắn nhắc nhở có nội dung
	} else {
			finalReminderMessage = `🔔 ${userName} ơi, hình như bạn đã yêu cầu tôi nhắc bạn làm việc gì đó thì phải? Có lẽ bạn đã quên rồi chăng? 🤔`; // Tin nhắn nhắc nhở không có nội dung, thêm icon
	}

	return api.sendMessage({
			body: finalReminderMessage,
			mentions: [{
					tag: userName,
					id: senderID
			}]
	}, threadID); // Không cần messageID ở đây để tránh lỗi nếu tin nhắn gốc đã bị gỡ
};