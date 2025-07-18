module.exports.config = {
	name: "autorep",
	version: "1.0.0",
	hasPermssion: 0,
	credits: "CThanh - modded by qh and Gemini 🦄💜", // Thêm credit của qh và Gemini
	description: "Tạo tin nhắn tự động phản hồi cho nhóm của bạn 💬",
	commandCategory: "Thành Viên 👥",
	usages: "[autorep] => [text cần autorep]",
	cooldowns: 5,
	dependencies: {
			"fs-extra": ""
	}
}

module.exports.onLoad = () => {
	const {
			existsSync,
			writeFileSync
	} = global.nodemodule["fs-extra"];
	const cachePath = __dirname + "/cache/data/autorep.json";
	if (!existsSync(cachePath)) {
			writeFileSync(cachePath, JSON.stringify([]), 'utf-8');
	}
	return;
}

module.exports.handleEvent = function({
	api,
	event
}) {
	const {
			readFileSync
	} = global.nodemodule["fs-extra"];
	// Kiểm tra event.body có tồn tại và không rỗng
	if (event.type !== "message_unsend" && event.body && event.body.length > 0) { // Sửa lỗi event.body.length !== -1
			const shortcut = JSON.parse(readFileSync(__dirname + "/cache/data/autorep.json"));
			if (shortcut.some(item => item.id == event.threadID)) {
					const getThread = shortcut.find(item => item.id == event.threadID).shorts;
					if (getThread.some(item => item.in.toLowerCase() == event.body.toLowerCase())) { // Chuyển về chữ thường để so sánh không phân biệt hoa thường
							const shortOut = getThread.find(item => item.in.toLowerCase() == event.body.toLowerCase()).out;
							if (shortOut.includes(" | ")) { // Sử dụng includes thay vì indexOf != -1
									const arrayOut = shortOut.split(" | ");
									return api.sendMessage(`${arrayOut[Math.floor(Math.random() * arrayOut.length)]}`, event.threadID);
							} else {
									return api.sendMessage(`${shortOut}`, event.threadID);
							}
					}
			}
	}
}

module.exports.run = function({
	api,
	event,
	args
}) {
	const {
			readFile,
			writeFile
	} = global.nodemodule["fs-extra"];
	var {
			threadID,
			messageID
	} = event;
	var content = args.join(" ");

	// Chuyển toàn bộ nội dung thành chữ thường để xử lý lệnh
	const command = content.toLowerCase().split(" ")[0];

	if (!content) return api.sendMessage("💡 Bạn ơi, hãy nhập đúng cú pháp nha! Gõ:\n 👉 autorep [input] => [output]\n 👉 autorep del [input]\n 👉 autorep all", threadID, messageID);

	if (command === "del") { // Đã chuyển thành chữ thường để so sánh
			let delThis = content.slice(4).trim(); // Sử dụng slice(4) và trim() để lấy từ cần xóa
			if (!delThis) return api.sendMessage("🔍 Không tìm thấy autorep bạn cần xóa. Thử lại xem sao? 🦄💜", threadID, messageID);

			return readFile(__dirname + "/cache/data/autorep.json", "utf-8", (err, data) => {
					if (err) {
							console.error("Lỗi đọc file autorep.json:", err); // Sửa lỗi console.error
							return api.sendMessage("Ối! Có lỗi khi đọc dữ liệu autorep rồi! 🥺", threadID, messageID);
					}
					var oldData = JSON.parse(data);
					if (!oldData.some(item => item.id == threadID)) {
							return api.sendMessage("🧐 Nhóm bạn chưa có autorep nào để xóa đâu! 🦄💜", threadID, messageID);
					}

					var getThread = oldData.find(item => item.id == threadID).shorts;
					const initialLength = getThread.length;
					// Lọc ra các autorep cần xóa (không phân biệt hoa thường)
					getThread = getThread.filter(item => item.in.toLowerCase() !== delThis.toLowerCase());

					if (getThread.length === initialLength) { // Kiểm tra xem có phần tử nào bị xóa không
							return api.sendMessage("Không tìm thấy autorep bạn cần xóa trong danh sách! 🦄💜", threadID, messageID);
					}

					// Cập nhật lại shorts trong oldData
					oldData.find(item => item.id == threadID).shorts = getThread;

					writeFile(__dirname + "/cache/data/autorep.json", JSON.stringify(oldData, null, "\t"), "utf-8", (err) => { // Thêm null, "\t" để format JSON đẹp hơn
							if (err) {
									console.error("Lỗi ghi file autorep.json:", err);
									return api.sendMessage("Lỗi rồi! Không thể xóa autorep được! 😥", threadID, messageID);
							}
							api.sendMessage("✨ Đã xóa autorep thành công! Bye bye 👋", threadID, messageID);
					});
			});
	} else if (command === "all") { // Đã chuyển thành chữ thường để so sánh
			return readFile(__dirname + "/cache/data/autorep.json", "utf-8", (err, data) => {
					if (err) {
							console.error("Lỗi đọc file autorep.json:", err);
							return api.sendMessage("Ối! Có lỗi khi đọc dữ liệu autorep rồi! 🥺", threadID, messageID);
					}
					let allData = JSON.parse(data);
					let msg = '📜 Danh sách các tin nhắn tự động (autorep) trong nhóm bạn:\n\n';
					if (!allData.some(item => item.id == threadID)) {
							return api.sendMessage("Hiện tại nhóm bạn chưa có autorep nào đâu! Thử tạo một cái đi! 😉🦄💜", threadID, messageID);
					}
					if (allData.some(item => item.id == threadID)) {
							let getThread = allData.find(item => item.id == threadID).shorts;
							if (getThread.length === 0) {
									return api.sendMessage("Hiện tại nhóm bạn chưa có autorep nào đâu! Thử tạo một cái đi! 😉🦄💜", threadID, messageID);
							}
							getThread.forEach((item, index) => msg += `${index + 1}. ${item.in}  ➡️  ${item.out}\n`); // Định dạng lại tin nhắn list
					}
					api.sendMessage(msg + "\n\nCứ tiếp tục thêm nhiều autorep hay ho vào nhé! 🤩🦄💜", threadID, messageID); // Thêm icon và thông điệp cuối
			});
	} else {
			let narrow = content.indexOf(" => ");
			if (narrow === -1) return api.sendMessage("❗ Dùng sai cú pháp rồi bạn ơi! Phải là `[input] => [output]` đó nha. 🦄💜", threadID, messageID);
			let shortin = content.slice(0, narrow).trim(); // Loại bỏ khoảng trắng thừa
			let shortout = content.slice(narrow + 4).trim(); // Loại bỏ khoảng trắng thừa
			if (!shortin) return api.sendMessage("🧐 Thiếu 'input' rồi! Bạn muốn bot phản hồi khi nào? 🦄💜", threadID, messageID);
			if (!shortout) return api.sendMessage("🤔 Thiếu 'output' rồi! Bot sẽ nói gì khi nhận được 'input' đó? 🦄💜", threadID, messageID);
			if (shortin.toLowerCase() === shortout.toLowerCase()) return api.sendMessage("💡 'Input' và 'Output' phải khác nhau nha bạn! Bot không thể tự trả lời chính nó được đâu. 🦄💜", threadID, messageID); // So sánh không phân biệt hoa thường

			return readFile(__dirname + "/cache/data/autorep.json", "utf-8", (err, data) => {
					if (err) {
							console.error("Lỗi đọc file autorep.json:", err);
							return api.sendMessage("Ối! Có lỗi khi đọc dữ liệu autorep rồi! 🥺", threadID, messageID);
					}
					var oldData = JSON.parse(data);
					if (!oldData.some(item => item.id == threadID)) {
							let addThis = {
									id: threadID,
									shorts: []
							}
							addThis.shorts.push({
									in: shortin,
									out: shortout
							});
							oldData.push(addThis);
							return writeFile(__dirname + "/cache/data/autorep.json", JSON.stringify(oldData, null, "\t"), "utf-8", (err) => {
									if (err) {
											console.error("Lỗi ghi file autorep.json:", err);
											return api.sendMessage("Lỗi rồi! Không thể tạo autorep được! 😥", threadID, messageID);
									}
									api.sendMessage("🎉 Đã tạo autorep thành công! Giờ thì bot có thể nói chuyện theo ý bạn rồi! 🤩🦄💜", threadID, messageID);
							});
					} else {
							let getShort = oldData.find(item => item.id == threadID);
							if (getShort.shorts.some(item => item.in.toLowerCase() == shortin.toLowerCase())) { // So sánh không phân biệt hoa thường
									let index = getShort.shorts.findIndex(item => item.in.toLowerCase() == shortin.toLowerCase());
									let output = getShort.shorts[index].out;
									getShort.shorts[index].out = output + " | " + shortout;
									api.sendMessage("✨ Autorep này đã tồn tại rồi, Gemini đã thêm output mới vào đó! 🦄💜", threadID, messageID);
									return writeFile(__dirname + "/cache/data/autorep.json", JSON.stringify(oldData, null, "\t"), "utf-8", (err) => {
											if (err) {
													console.error("Lỗi ghi file autorep.json:", err);
													return api.sendMessage("Lỗi rồi! Không thể cập nhật autorep được! 😥", threadID, messageID);
											}
									});
							}
							getShort.shorts.push({
									in: shortin,
									out: shortout
							});
							return writeFile(__dirname + "/cache/data/autorep.json", JSON.stringify(oldData, null, "\t"), "utf-8", (err) => {
									if (err) {
											console.error("Lỗi ghi file autorep.json:", err);
											return api.sendMessage("Lỗi rồi! Không thể tạo autorep được! 😥", threadID, messageID);
									}
									api.sendMessage("🎉 Đã tạo autorep thành công! Giờ thì bot có thể nói chuyện theo ý bạn rồi! 🤩🦄💜", threadID, messageID);
							});
					}
			});
	}
}