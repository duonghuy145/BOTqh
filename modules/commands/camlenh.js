module.exports.config = {
	name: "camlenh",
	version: "1.1.0", // Nâng version để đánh dấu bản mod
	hasPermssion: 1, // Quyền admin nhóm
	credits: "Mirai Team (Đã điều chỉnh bởi qh và Gemini) 👑", // Cập nhật credit
	description: "🚫 Cấm hoặc gỡ cấm sử dụng lệnh trong nhóm.",
	commandCategory: "Quản Trị Viên",
	usages: "add [tên lệnh] | del [tên lệnh]\nHoặc: camlenh add all | camlenh del all", // Sửa lại usages rõ ràng hơn
	cooldowns: 5,
	dependencies: {
			"moment-timezone": ""
	}
};

module.exports.languages = {
	"vi": {
			"allCommand": "toàn bộ lệnh",
			"commandList": "các lệnh",
			"banCommandSuccess": "✅ Yêu cầu cấm lệnh đã được xử lý thành công. Các lệnh sau đã bị vô hiệu hóa: %1.",
			"unbanCommandSuccess": "✅ Yêu cầu gỡ cấm lệnh đã được xử lý thành công. %1 đã được kích hoạt lại.",
			"missingCommandInput": "❌ Vui lòng cung cấp tên lệnh cần cấm hoặc gỡ cấm.",
			"notExistBanCommand": "❌ Nhóm của bạn hiện không có lệnh nào bị cấm.",
			"IDNotFound": "❌ ID hội thoại bạn nhập không tồn tại trong hệ thống hoặc không phải là ID nhóm." // Thêm thông báo này
	}
};

module.exports.handleReaction = async ({ event, api, Threads, handleReaction, getText }) => {
	if (parseInt(event.userID) !== parseInt(handleReaction.author)) return; // Chỉ người dùng lệnh mới được tương tác

	const { threadID } = event;
	const { messageID, type, targetID, commandNeedBan } = handleReaction;

	// Xóa handleReaction sau khi xử lý
	global.client.handleReaction.splice(global.client.handleReaction.findIndex(item => item.messageID == messageID), 1);

	switch (type) {
			case "banCommand": {
					try {    
							let data = (await Threads.getData(targetID)).data || {};
							// Đảm bảo commandBanned là một mảng và chỉ thêm các lệnh chưa có
							const currentBanned = new Set(data.commandBanned || []);
							commandNeedBan.forEach(cmd => currentBanned.add(cmd));
							data.commandBanned = Array.from(currentBanned);

							await Threads.setData(targetID, { data });
							global.data.commandBanned.set(targetID, data.commandBanned); // Cập nhật global data

							const bannedCommandsList = commandNeedBan.length === global.client.commands.size ? getText("allCommand") : commandNeedBan.join(", ");
							return api.sendMessage(getText("banCommandSuccess", bannedCommandsList), threadID, () => {
									api.unsendMessage(messageID); // Gỡ tin nhắn xác nhận
							});
					} catch (e) { 
							console.error("❌ Lỗi khi cấm lệnh:", e);
							return api.sendMessage(`❌ Đã xảy ra lỗi trong quá trình cấm lệnh: ${e.message}. Vui lòng thử lại.`, threadID);
					}
			}
			case "unbanCommand": {
					try {
							let data = (await Threads.getData(targetID)).data || {};
							// Lọc bỏ các lệnh cần gỡ cấm
							data.commandBanned = (data.commandBanned || []).filter(item => !commandNeedBan.includes(item));

							await Threads.setData(targetID, { data });
							global.data.commandBanned.set(targetID, data.commandBanned); // Cập nhật global data

							if (data.commandBanned.length === 0) {
									global.data.commandBanned.delete(targetID); // Xóa khỏi global nếu không còn lệnh nào bị cấm
							}

							const unbannedCommandsList = commandNeedBan.length === global.data.commandBanned.get(targetID).length ? getText("allCommand") : commandNeedBan.join(", ");
							return api.sendMessage(getText("unbanCommandSuccess", unbannedCommandsList), threadID, () => {
									api.unsendMessage(messageID); // Gỡ tin nhắn xác nhận
							});
					} catch (e) { 
							console.error("❌ Lỗi khi gỡ cấm lệnh:", e);
							return api.sendMessage(`❌ Đã xảy ra lỗi trong quá trình gỡ cấm lệnh: ${e.message}. Vui lòng thử lại.`, threadID);
					}
			}
			default:
					break;
	}
};

module.exports.run = async ({ event, api, args, Threads, getText }) => {    
	const { threadID, messageID } = event;
	let targetID = String(args[1]);
	let commandArg = (args.slice(2, args.length)).join(" ");

	// Nếu không có ID nhóm cụ thể, mặc định là nhóm hiện tại
	if (isNaN(targetID)) {
			commandArg = (args.slice(1, args.length)).join(" ");
			targetID = String(event.threadID);
	}

	// Kiểm tra xem ID nhóm có tồn tại trong dữ liệu của bot không (nếu là nhóm khác)
	if (targetID !== String(event.threadID) && !global.data.allThreadID.includes(targetID)) {
			return api.sendMessage(getText("IDNotFound"), threadID, messageID);
	}

	// Kiểm tra đầu vào lệnh
	if (!commandArg || commandArg.trim().length === 0) {
			return api.sendMessage(getText("missingCommandInput"), threadID, messageID);
	}

	switch (args[0]) {
			case "add": {
					let commandNeedBan = [];
					if (commandArg.toLowerCase() === "all") {
							// Lấy tất cả lệnh hiện có của bot
							global.client.commands.forEach(cmd => {
									// Không cấm lệnh camlenh và các lệnh của hệ thống (nếu có)
									if (cmd.config.name !== this.config.name && cmd.config.commandCategory !== "Hệ Thống") {
											commandNeedBan.push(cmd.config.name);
									}
							});
					} else {
							commandNeedBan = commandArg.split(" ").map(cmd => cmd.toLowerCase());
							// Kiểm tra xem các lệnh có tồn tại không
							const invalidCommands = commandNeedBan.filter(cmd => !global.client.commands.has(cmd));
							if (invalidCommands.length > 0) {
									return api.sendMessage(`❌ Các lệnh sau không tồn tại: ${invalidCommands.join(", ")}. Vui lòng kiểm tra lại.`, threadID, messageID);
							}
							// Loại bỏ lệnh "camlenh" khỏi danh sách cần cấm để tránh tự khóa
							commandNeedBan = commandNeedBan.filter(cmd => cmd !== this.config.name);
					}

					if (commandNeedBan.length === 0) {
							return api.sendMessage("Không có lệnh hợp lệ nào để cấm hoặc lệnh đó không thể bị cấm.", threadID, messageID);
					}

					const displayCommands = commandNeedBan.length === global.client.commands.size - 1 ? getText("allCommand") : commandNeedBan.join(", "); // Trừ đi lệnh camlenh
					return api.sendMessage(getText("returnBanCommand", targetID, displayCommands), threadID, (error, info) => {
							if (error) {
									console.error("❌ Lỗi khi gửi tin nhắn xác nhận:", error);
									return api.sendMessage("Đã xảy ra lỗi khi tạo yêu cầu. Vui lòng thử lại.", threadID, messageID);
							}
							global.client.handleReaction.push({
									type: "banCommand",
									targetID,
									commandNeedBan,
									name: this.config.name,
									messageID: info.messageID,
									author: event.senderID,
							});
					}, messageID);
			}

			case "del": {
					if (!global.data.commandBanned.has(targetID)) {
							return api.sendMessage(getText("notExistBanCommand"), threadID, messageID);
					}

					let commandNeedUnban = [];
					if (commandArg.toLowerCase() === "all") {
							commandNeedUnban = global.data.commandBanned.get(targetID);
					} else {
							commandNeedUnban = commandArg.split(" ").map(cmd => cmd.toLowerCase());
							// Kiểm tra xem các lệnh này có đang bị cấm không
							const currentBanned = global.data.commandBanned.get(targetID);
							const notBannedCommands = commandNeedUnban.filter(cmd => !currentBanned.includes(cmd));
							if (notBannedCommands.length > 0) {
									return api.sendMessage(`❌ Các lệnh sau không bị cấm trong nhóm này: ${notBannedCommands.join(", ")}.`, threadID, messageID);
							}
					}

					if (commandNeedUnban.length === 0) {
							return api.sendMessage("Không có lệnh nào để gỡ cấm hoặc các lệnh bạn nhập không đang bị cấm.", threadID, messageID);
					}

					const displayCommands = commandNeedUnban.length === global.data.commandBanned.get(targetID).length ? getText("allCommand") : commandNeedUnban.join(", ");
					return api.sendMessage(getText("returnUnbanCommand", targetID, displayCommands), threadID, (error, info) => {
							if (error) {
									console.error("❌ Lỗi khi gửi tin nhắn xác nhận:", error);
									return api.sendMessage("Đã xảy ra lỗi khi tạo yêu cầu. Vui lòng thử lại.", threadID, messageID);
							}
							global.client.handleReaction.push({
									type: "unbanCommand",
									targetID,
									commandNeedUnban, // Đổi tên biến cho rõ ràng hơn
									name: this.config.name,
									messageID: info.messageID,
									author: event.senderID,
							});
					}, messageID);
			}
			default:
					return api.sendMessage(`📌 Sử dụng: ${this.config.name} add [tên lệnh] hoặc ${this.config.name} del [tên lệnh].\nĐể cấm/gỡ cấm toàn bộ lệnh, dùng: ${this.config.name} add all / ${this.config.name} del all.`, threadID, messageID);
	}
};