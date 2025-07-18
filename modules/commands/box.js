module.exports.config = {
	name: "box",
	version: "1.0.1", // Nâng version để đánh dấu bản mod
	hasPermssion: 0,
	credits: "tdunguwu (Đã điều chỉnh bởi qh và Gemini) 👑", // Cập nhật credit
	description: "🔍 Xem thông tin chi tiết về nhóm hiện tại.",
	commandCategory: "Thông Tin", // Đổi sang category Thông Tin
	usages: "", // Không cần usages vì lệnh không có tham số
	cooldowns: 5
};

module.exports.run = async function ({ api, event, args, Threads, Users }) {
	const { threadID, messageID } = event;

	try {
			// Lấy thông tin nhóm hiện tại
			const threadInfo = await api.getThreadInfo(threadID);

			if (!threadInfo) {
					return api.sendMessage("❌ Không thể lấy thông tin nhóm. Vui lòng thử lại sau.", threadID, messageID);
			}

			let { threadName, participantIDs, adminIDs, messageCount, approvalMode, privacy, id } = threadInfo;

			// Xử lý tên nhóm nếu bị null
			threadName = threadName || "Không có tên";

			// Chuyển đổi ID admin từ mảng đối tượng sang mảng ID
			const adminIDList = adminIDs.map(item => item.id);

			let listAdmin = "Không có quản trị viên";
			if (adminIDList.length > 0) {
					const adminNames = await Promise.all(adminIDList.map(async (adminId) => {
							const userInfo = await Users.getData(adminId);
							return userInfo ? userInfo.name : "Người dùng không tồn tại";
					}));
					listAdmin = adminNames.join(", ");
			}

			// Kiểm tra chế độ duyệt thành viên
			let approvalModeText = "Đã tắt";
			if (approvalMode) {
					approvalModeText = "Đã bật (Quản trị viên cần duyệt thành viên mới)";
			}

			// Kiểm tra quyền riêng tư của nhóm
			const privacyText = privacy === "private" ? "Riêng tư" : "Công khai";

			// Tạo tin nhắn kết quả
			const msg = `
📝 Thông tin nhóm hiện tại:
━━━━━━━━━━━━━━━━━━
🆔 ID Nhóm: ${id}
✨ Tên Nhóm: ${threadName}
👥 Tổng số thành viên: ${participantIDs.length}
👑 Quản trị viên: ${listAdmin}
💬 Tổng số tin nhắn: ${messageCount}
✅ Chế độ duyệt thành viên mới: ${approvalModeText}
🔐 Quyền riêng tư: ${privacyText}
━━━━━━━━━━━━━━━━━━
			`;

			api.sendMessage(msg, threadID, messageID);

	} catch (error) {
			console.error("❌ Lỗi khi lấy thông tin nhóm:", error);
			api.sendMessage(`Đã xảy ra lỗi trong quá trình lấy thông tin nhóm. Chi tiết: ${error.message}`, threadID, messageID);
	}
};