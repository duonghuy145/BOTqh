module.exports.config = {
name: "out",
version: "1.0.1", // Tăng version cho bạn dễ quản lý
hasPermssion: 3,
credits: "ChatGpt (mod bởi qh)", // Thêm credit của bạn vào
description: "Khiến bot rời khỏi nhóm chỉ định hoặc nhóm hiện tại.",
commandCategory: "Admin",
usages: "[ID_nhóm_muốn_rời]", // Rõ ràng hơn về cách dùng
cooldowns: 3
};

module.exports.run = async function({ api, event, args }) {
const threadIDToLeave = parseInt(args[0]) || event.threadID; // Đổi tên biến cho dễ hiểu

// Gửi tin nhắn tạm biệt trước khi rời nhóm
return api.sendMessage('👋 Hẹn gặp lại nhé! Bot đã nhận lệnh rời khỏi nhóm này từ Admin rồi. 🥺', threadIDToLeave, () => {
// Sau khi gửi tin nhắn, bot sẽ rời nhóm
api.removeUserFromGroup(api.getCurrentUserID(), threadIDToLeave)
.then(() => {
console.log(`Bot đã rời khỏi nhóm với ID: ${threadIDToLeave}`); // Log ra console để kiểm tra
})
.catch(error => {
console.error(`Không thể rời khỏi nhóm ${threadIDToLeave}:`, error); // Log lỗi nếu có
api.sendMessage(`Bot không thể rời khỏi nhóm ID: ${threadIDToLeave}. Có lỗi xảy ra: ${error.message}`, event.threadID, event.messageID);
});
});
};