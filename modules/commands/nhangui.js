const axios = require('axios');
const cheerio = require('cheerio');
const qs = require('querystring'); // Đảm bảo bạn đã cài đặt thư viện này: npm install querystring

module.exports.config = {
name: "nhangui",
version: "1.0.0",
hasPermssion: 0,
credits: "modded by qh and Gemini ✨", // Đã thêm Gemini vào credits!
description: "Tạo trang web chữ rơi kèm nhạc để nhắn gửi tình cảm 💖",
commandCategory: "Tiện Ích 🚀",
usages: "nhangui",
cooldowns: 5,
};

// Map STT nhạc với giá trị trên website
const musicMap = {
1: { name: "Nơi này có anh", value: "noi-nay-co-anh" },
2: { name: "Phép Màu", value: "phep-mau" },
3: { name: "Tín hiệu từ trái tim", value: "tin-hieu-tu-trai-tim" },
4: { name: "Chắc yêu là đây", value: "chac-yeu-la-day" },
5: { name: "Cô gái m52", value: "co-gai-m52" },
6: { name: "Hẹn gặp em dưới ánh trăng", value: "hen-gap-em-duoi-anh-trang" },
7: { name: "Mượn rượu tỏ tình", value: "muon-ruou-to-tinh" },
8: { name: "Người âm phủ", value: "nguoi-am-phu" }
};

module.exports.run = async function({ api, event, args }) {
const { threadID, messageID } = event;

// Gửi tin nhắn hướng dẫn và chờ người dùng reply
const promptMessage = `
🌟 **[ NHẮN GỬI TÌNH CẢM ]** 🌟
━━━━━━━━━━━━━━━━━━
👉 Vui lòng nhập nội dung muốn gửi. 💌
👉 Vui lòng chọn **1** trong những bản nhạc sau: 🎵

1. Nơi này có anh
2. Phép Màu
3. Tín hiệu từ trái tim
4. Chắc yêu là đây
5. Cô gái m52
6. Hẹn gặp em dưới ánh trăng
7. Mượn rượu tỏ tình
8. Người âm phủ
━━━━━━━━━━━━━━━━━━
📝 **Hãy trả lời tin nhắn này của bot theo cú pháp:**
\`[tin nhắn muốn gửi] + [số thứ tự nhạc]\`
`;

return api.sendMessage(promptMessage, threadID, (err, info) => {
if (err) {
console.error("Lỗi khi gửi prompt nhắn gửi:", err);
return api.sendMessage("❌ Đã có lỗi xảy ra khi tạo tin nhắn hướng dẫn. Vui lòng thử lại sau. 🥲", threadID, messageID);
}
global.client.handleReply.push({
name: this.config.name,
messageID: info.messageID,
author: event.senderID,
type: "nhangui_prompt" // Đặt type để handleReply nhận diện
});
}, messageID);
};

module.exports.handleReply = async function({ api, event, handleReply }) {
const { threadID, messageID, body } = event;

// Kiểm tra xem đây có phải là reply cho lệnh nhắn gửi hay không
if (handleReply.type !== "nhangui_prompt" || handleReply.author !== event.senderID) {
return; // Bỏ qua nếu không đúng người hoặc không đúng type
}

api.unsendMessage(handleReply.messageID); // Xóa tin nhắn prompt cũ

const parts = body.split('+');
if (parts.length < 2) {
return api.sendMessage("❗ Cú pháp không hợp lệ! Vui lòng trả lời theo định dạng: `[tin nhắn muốn gửi] + [số thứ tự nhạc]`", threadID, messageID);
}

const messageContent = parts[0].trim();
const musicChoice = parseInt(parts[1].trim());

if (isNaN(musicChoice) || musicChoice < 1 || musicChoice > 8) {
return api.sendMessage("❗ Số thứ tự nhạc không hợp lệ! Vui lòng chọn số từ 1 đến 8. 🎶", threadID, messageID);
}

const selectedMusic = musicMap[musicChoice];
if (!selectedMusic) {
// This case should ideally not be hit if musicChoice is already validated between 1-8
return api.sendMessage("❌ Lựa chọn nhạc không hợp lệ. Vui lòng kiểm tra lại số thứ tự nhạc. 🤔", threadID, messageID);
}

api.sendMessage(`⏳ Đang tạo trang web nhắn gửi tình cảm cho bạn với nội dung "${messageContent}" và nhạc "${selectedMusic.name}"... Chờ chút nha! 🚀`, threadID, messageID);

try {
const postData = qs.stringify({
txt_noi_dung_bai_hat: messageContent,
nhac_nen: selectedMusic.value,
submit: "Submit" // Quan trọng: website yêu cầu biến submit này
});

const response = await axios.post(
"https://taoanhdep.com/tao-link-website-to-tinh-chu-roi",
postData,
{
headers: {
'Content-Type': 'application/x-www-form-urlencoded' // Cần set header này
}
}
);

const $ = cheerio.load(response.data);
// Cố gắng tìm thẻ input có class "form-control" VÀ thuộc tính readonly="readonly"
// Hoặc input có class "form-control" với type="text" và thuộc tính readonly (không cần giá trị)
const resultLink = $('input.form-control[readonly="readonly"]').val() || $('input.form-control[type="text"][readonly]').val(); 

if (resultLink) {
const finalMessage = `
💌 **Tin nhắn tình cảm của bạn đã sẵn sàng!** 💌
🔗 **Link website:** ${resultLink}

📌 **Chú ý:** Nhớ bấm vào icon mở nhạc 🎶 ở góc trên bên phải của trang web để phát bản nhạc bạn yêu thích nhé! ❤️
`;
api.sendMessage(finalMessage, threadID, messageID);
} else {
api.sendMessage("❌ Rất tiếc, Gemini không tìm thấy link kết quả. Có thể website đang gặp sự cố hoặc cú pháp không hợp lệ. 😥", threadID, messageID);
}

} catch (error) {
console.error("Lỗi khi tạo website nhắn gửi:", error);
api.sendMessage("❌ Đã xảy ra lỗi trong quá trình tạo website. Vui lòng thử lại sau nha! 🥺", threadID, messageID);
}
};