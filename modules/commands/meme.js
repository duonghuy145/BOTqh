const axios = require("axios");
const fs = require("fs-nextra"); // Sử dụng fs-nextra để tận dụng Promise-based file operations
const path = require("path");

module.exports.config = {
    name: "meme",
    version: "1.0.1", // Nâng version lên xíu ⬆️
    hasPermssion: 0,
    credits: "Tuấn, modded by qh and Gemini ✨", // Giữ nguyên credits gốc và thêm tên chúng ta
    description: "random ảnh meme việt nam hài hước 😂", // Chữ thường, viết hoa đầu dòng + icon
    commandCategory: "ảnh 📸", // Chữ thường, viết hoa đầu dòng + icon
    usages: "", // Không cần usages nếu chỉ dùng lệnh không có args
    cooldowns: 5, // Tăng cooldowns lên 5 giây hợp lý hơn
};

module.exports.run = async ({ api, event }) => {
    const memeLinks = [
        "https://i.imgur.com/Jy5bCx2.jpg",
        "https://i.imgur.com/yAtQUQu.jpg",
        "https://i.imgur.com/MdhUHdV.jpg",
        "https://i.imgur.com/KKmkIop.jpg",
        "https://i.imgur.com/Adr4be1.jpg",
        "https://i.imgur.com/s2giVqG.jpg",
        "https://i.imgur.com/OLp3vhz.png",
        "https://i.imgur.com/W2VGWqb.jpg",
        "https://i.imgur.com/EBJcGFf.jpg",
        "https://i.imgur.com/WYchdJG.jpg",
        "https://i.imgur.com/dwVGQD6.jpg",
        "https://i.imgur.com/3MbRb7U.jpg",
        "https://i.imgur.com/cpzJeWp.jpg",
        "https://i.imgur.com/D281oqO.jpg",
        "https://i.imgur.com/JNKZA8P.jpg",
        "https://i.imgur.com/5Nl04oP.jpg",
        "https://i.imgur.com/wMxv9qa.jpg",
        "https://i.imgur.com/UmfVLiD.jpg",
        "https://i.imgur.com/fIpWNOy.jpg",
        "https://i.imgur.com/GtcFh2Y.jpg",
        "https://i.imgur.com/1HFEzu0.jpg",
        "https://i.imgur.com/qSuCJzj.jpg",
        "https://i.imgur.com/AZpbUsz.png",
        "https://i.imgur.com/JtGE76p.jpg",
        "https://i.imgur.com/ZJYI9pQ.jpg",
        "https://i.imgur.com/nC9aCJZ.jpg",
        "https://i.imgur.com/BI9eFuS.jpg",
        "https://i.imgur.com/ZPUguG2.jpg",
        "https://i.imgur.com/IA8Dl6W.jpg",
        "https://i.imgur.com/xYvvgIS.jpg",
        "https://i.imgur.com/P8Cuobo.jpg",
        "https://i.imgur.com/ZB3G2XY.jpg",
        "https://i.imgur.com/X8dyJFy.jpg",
        "https://i.imgur.com/DXbEYs5.jpg",
        "https://i.imgur.com/Kp4oBzH.jpg",
    ];

    const randomLink = memeLinks[Math.floor(Math.random() * memeLinks.length)];
    const cachePath = path.join(__dirname, "/cache/meme.jpg"); // Đặt tên file cache rõ ràng hơn

    try {
        // Tải ảnh về cache
        const response = await axios.get(randomLink, { responseType: "arraybuffer" });
        await fs.writeFileSync(cachePath, Buffer.from(response.data, "binary"));

        // Gửi ảnh
        await api.sendMessage({
            body: `Đây là một chiếc meme hài hước dành cho bạn! 😂`, // Thêm body tin nhắn
            attachment: fs.createReadStream(cachePath)
        }, event.threadID, event.messageID);

        // Xóa ảnh khỏi cache sau khi gửi
        await fs.unlink(cachePath);

    } catch (error) {
        console.error("Lỗi khi gửi ảnh meme:", error);
        api.sendMessage("Rất tiếc, đã xảy ra lỗi khi lấy ảnh meme. Vui lòng thử lại sau nhé! 😅", event.threadID, event.messageID); // Viết hoa đầu dòng + icon
    }
};