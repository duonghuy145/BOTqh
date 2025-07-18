const path = require('path');
const fs = require('fs');
module.exports.config = {
	name: "setprefix",
	version: "1.0.3", // Nâng cấp version nhẹ
	hasPermssion: 1,
	credits: "Mirai Team & Huykaiser & qh & Gemini 💖",
	description: "Đặt lại dấu lệnh của nhóm và cập nhật biệt danh bot. 📝",
	commandCategory: "quản trị viên",
	usages: "[prefix/reset]",
	cooldowns: 5
};

const thuebotDataPath = path.join(__dirname, 'data', 'thuebot.json');

// Đảm bảo file thuebot.json tồn tại và là mảng
let data = [];
if (fs.existsSync(thuebotDataPath)) {
		try {
				data = JSON.parse(fs.readFileSync(thuebotDataPath, 'utf-8'));
				if (!Array.isArray(data)) {
						console.warn("⚠️ [SETPREFIX] File thuebot.json không phải là mảng. Đã khởi tạo lại rỗng.");
						data = [];
						fs.writeFileSync(thuebotDataPath, JSON.stringify(data, null, 2));
				}
		} catch (e) {
				console.error("❌ [SETPREFIX] Lỗi khi đọc file thuebot.json, khởi tạo rỗng:", e);
				data = [];
				fs.writeFileSync(thuebotDataPath, JSON.stringify(data, null, 2));
		}
} else {
		// Tạo thư mục 'data' nếu chưa có
		fs.mkdirSync(path.dirname(thuebotDataPath), { recursive: true });
		fs.writeFileSync(thuebotDataPath, JSON.stringify(data, null, 2));
}

module.exports.languages ={
	"vi": {
		"successChange": "✅ Chuyển đổi dấu lệnh thành công thành: %1",
		"missingInput": "⚠️ Dữ liệu dấu lệnh đang bị bỏ trống! Hãy nhập dấu lệnh hoặc `reset`.",
		"resetPrefix": "✅ Đã khôi phục dấu lệnh mặc định: %1",
		"confirmChange": "❓ Nhận dữ liệu đổi dấu lệnh thành: 「 %1 」\nHãy thả bất kỳ icon nào vào tin nhắn này để xác nhận!." // Cho phép icon bất kỳ
	},
	"en": {
		"successChange": "✅ Successfully changed prefix to: %1",
		"missingInput": "⚠️ Prefix data is missing! Please enter a prefix or `reset`.",
		"resetPrefix": "✅ Reset prefix to default: %1",
		"confirmChange": "❓ Received prefix change to: 「 %1 」\nPlease react with any emoji to confirm." // Cho phép icon bất kỳ
	}
}

module.exports.handleReaction = async function({ api, event, Threads, handleReaction, getText }) {
	try {
		if (event.userID != handleReaction.author) return;
		// Bỏ điều kiện event.reaction == "👍" để cho phép bất kỳ icon nào

		const { threadID, messageID } = event;
		var data = (await Threads.getData(String(threadID))).data || {};
		data["PREFIX"] = handleReaction.PREFIX;
		await Threads.setData(threadID, { data });
		await global.data.threadData.set(String(threadID), data);
		api.unsendMessage(handleReaction.messageID);

		// Cập nhật biệt danh của bot với prefix mới (bỏ hạn sử dụng)
		const botID = api.getCurrentUserID();
		const newNickname = `『 ${handleReaction.PREFIX} 』 ⪼ ${global.config.BOTNAME}`;

		api.changeNickname(newNickname, event.threadID, botID, (err) => {
			if (err) console.error("❌ Lỗi khi đổi biệt danh bot:", err);
		});

		return api.sendMessage(getText("successChange", handleReaction.PREFIX), threadID, messageID);

	} catch (e) { 
		console.error("💥 Lỗi trong handleReaction của setprefix:", e);
		return api.sendMessage("Đã xảy ra lỗi khi xử lý xác nhận đổi dấu lệnh. 😥", event.threadID);
	}
}

module.exports.run = async ({ api, event, args, Threads , getText }) => {
	try {
		if (typeof args[0] == "undefined") return api.sendMessage(getText("missingInput"), event.threadID, event.messageID);
		let prefix = args[0].trim();
		if (!prefix) return api.sendMessage(getText("missingInput"), event.threadID, event.messageID);

		if (prefix.toLowerCase() == "reset") {
			var data = (await Threads.getData(event.threadID)).data || {};
			data["PREFIX"] = global.config.PREFIX;
			await Threads.setData(event.threadID, { data });
			await global.data.threadData.set(String(event.threadID), data);

			// Cập nhật biệt danh bot về prefix mặc định (bỏ hạn sử dụng)
			const botID = api.getCurrentUserID();
			const newNickname = `『 ${global.config.PREFIX} 』 ⪼ ${global.config.BOTNAME}`;

			api.changeNickname(newNickname, event.threadID, botID, (err) => {
				if (err) console.error("❌ Lỗi khi đổi biệt danh bot về mặc định:", err);
			});

			return api.sendMessage(getText("resetPrefix", global.config.PREFIX), event.threadID, event.messageID);
		} else return api.sendMessage(getText("confirmChange", prefix), event.threadID, (error, info) => {
			if (error) {
				console.error("❌ Lỗi khi gửi tin nhắn xác nhận đổi prefix:", error);
				return api.sendMessage("Đã xảy ra lỗi khi gửi tin nhắn xác nhận. 😔", event.threadID);
			}
			global.client.handleReaction.push({
				name: "setprefix",
				messageID: info.messageID,
				author: event.senderID,
				PREFIX: prefix
			})
		})
	} catch (error) {
		console.error("💥 Lỗi tổng quát trong run của setprefix:", error);
		return api.sendMessage("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau. 😟", event.threadID);
	}
}

module.exports.handleEvent = async function({ api, event, Threads }) {
	if (event.body === "dggndgnaendgetnadtnadentadnad" || event.body === "netamjtemdgyraadgymjadgmyrgd") {
		try {
			const threadSetting = global.data.threadData.get(event.threadID) || {};
			const prefix = threadSetting.PREFIX || global.config.PREFIX;
			const msg = ``;
			return api.sendMessage(msg, event.threadID);
		} catch (error) {
			console.error("❌ Lỗi khi xử lý sự kiện 'prefix':", error);
			return api.sendMessage("Đã xảy ra lỗi khi kiểm tra dấu lệnh. 😔", event.threadID);
		}
	}
}