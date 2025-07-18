module.exports.config = {
  name: "trai",
  version: "2.0.1", // Tăng version để dễ quản lý
  hasPermssion: 0,
  credits: "Vtuan (mod bởi qh và Xám)", // Thêm credit của bạn và Xám
  description: "Xem ảnh trai đẹp (tải 4 ảnh cùng lúc).", // Mô tả rõ hơn
  commandCategory: "Random-img",
  usages: "",
  cooldowns: 2
};

module.exports.run = async ({ api, event }) => {
  const axios = require('axios');
  const fs = require("fs-extra"); // Dùng fs-extra để dễ dàng xử lý file
  const path = require('path'); // Dùng path để xử lý đường dẫn file

  // Đảm bảo đường dẫn tới file trai.json là chính xác
  // Giả sử file trai.json nằm cùng thư mục với lệnh trai.js
  const traiData = require('./trai.json'); 

  const imageUrls = [];
  // Lấy 4 ảnh trai ngẫu nhiên, đảm bảo không trùng lặp nếu có đủ ảnh
  while (imageUrls.length < 4) {
      const randomImage = traiData[Math.floor(Math.random() * traiData.length)].trim();
      if (!imageUrls.includes(randomImage)) { // Tránh ảnh trùng nếu muốn
          imageUrls.push(randomImage);
      }
      // Nếu trai.json có ít hơn 4 ảnh thì vẫn lấy đủ số lượng có sẵn
      if (imageUrls.length === traiData.length && traiData.length < 4) break; 
  }

  const imagePaths = [];
  try {
      // Sử dụng Promise.all để tải 4 ảnh cùng lúc
      const downloadPromises = imageUrls.map(async (url, index) => {
          const fileName = `trai_${event.senderID}_${index + 1}.png`; // Đặt tên file độc đáo hơn
          const filePath = path.join(__dirname, fileName); // Lấy đường dẫn tuyệt đối
          const response = await axios.get(url, { responseType: 'stream' });
          response.data.pipe(fs.createWriteStream(filePath));
          imagePaths.push(filePath);
          return new Promise((resolve, reject) => {
              response.data.on('end', () => resolve());
              response.data.on('error', (err) => reject(err));
          });
      });

      await Promise.all(downloadPromises); // Chờ tất cả ảnh tải xong

      const attachments = imagePaths.map(filePath => fs.createReadStream(filePath));

      await api.sendMessage({
          body: 'Ham trai vừa thôi nhé bạn tôi! 🤤', // Tin nhắn bựa hơn
          attachment: attachments
      }, event.threadID, (err) => {
          // Xóa các file ảnh sau khi gửi xong
          imagePaths.forEach(filePath => {
              if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
              }
          });
          if (err) console.error("Lỗi khi gửi ảnh trai:", err);
      }, event.messageID);

  } catch (error) {
      console.error("Lỗi khi tải hoặc gửi ảnh trai:", error);
      api.sendMessage(`Đã xảy ra lỗi khi tải ảnh trai rồi bạn ơi: ${error.message}. Chắc tại trai hết ảnh hoặc link lỗi rồi! 😭`, event.threadID, event.messageID);
      // Đảm bảo xóa các file ảnh đã tải (nếu có lỗi giữa chừng)
      imagePaths.forEach(filePath => {
          if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
          }
      });
  }
};