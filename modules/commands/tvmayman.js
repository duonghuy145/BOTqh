module.exports.config = {
	name: "tvmayman",
	version: "1.0.1", // Đã bump version lên một xíu cho nó máu 🔥
	hasPermssion: 0,
	credits: "modded by qh and Gemini ✨", // Credits đã được cập nhật nha!
	description: "Chọn ngẫu nhiên thành viên trong nhóm 🍀", // Thêm icon cho bắt mắt
	commandCategory: "Thành Viên 👥", // Thêm icon
	usages: "[số thành viên muốn chọn]", // Thêm hướng dẫn sử dụng rõ hơn
	cooldowns: 5 // Thêm cooldown để tránh spam
};

module.exports.run = async ({ api, event, args, Users }) => {
	const { threadID, messageID, participantIDs, isGroup } = event;

	if (!isGroup) {
		return api.sendMessage('❌ Lệnh này chỉ dùng được trong nhóm thôi nha! 🥲', threadID, messageID);
	}

	let num = parseInt(args[0]);

	// Kiểm tra nếu người dùng không nhập số hoặc nhập số không hợp lệ
	if (isNaN(num) || num <= 0) {
		num = 1; // Mặc định chọn 1 người nếu không có số hoặc số không hợp lệ
		api.sendMessage("💡 Bạn không nhập số hoặc số không hợp lệ. Gemini sẽ chọn 1 thành viên ngẫu nhiên nhé! 🍀", threadID, messageID);
	} else if (num > participantIDs.length) {
		return api.sendMessage(`⚠️ Số thành viên muốn chọn (${num}) lớn hơn tổng số thành viên trong nhóm (${participantIDs.length})! Vui lòng nhập số nhỏ hơn hoặc bằng tổng số thành viên. 🤔`, threadID, messageID);
	}

	// Xáo trộn danh sách thành viên trong nhóm
	const randomMembersID = participantIDs.sort(() => 0.5 - Math.random());

	const selectedMembersNames = [];
	for (let i = 0; i < num; i++) {
		try {
			const userInfo = await Users.getData(randomMembersID[i]);
			selectedMembersNames.push(userInfo.name);
		} catch (error) {
			console.error(`Lỗi khi lấy thông tin thành viên có ID ${randomMembersID[i]}:`, error);
			selectedMembersNames.push(`[Không xác định - ID: ${randomMembersID[i]}]`); // Thêm placeholder nếu không lấy được tên
		}
	}

	let message = `🎉 Tuyệt vời! ${num} thành viên may mắn được Bot "triệu hồi" là: \n\n`;
	selectedMembersNames.forEach((name, index) => {
		message += `${index + 1}. ${name}\n`;
	});
	message += `\nChúc mừng các bạn! 🥳`;

	return api.sendMessage(message, threadID, messageID);
};