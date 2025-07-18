module.exports.config = {
    name: "ghichu",
    version: "1.0.1", // Tăng version sau khi mod
    hasPermssion: 3, // Giữ nguyên quyền hạn
    credits: "D-Jukie - modded by qh and Gemini 🦄💜", // Thêm credit qh và Gemini
    description: "Quản lý và chia sẻ code từ nhiều nguồn 💾",
    commandCategory: "Admin 👑",
    usages: "reply link/tên_file, hoặc nhập tên_file để upload lên Pastebin",
    cooldowns: 5, // Tăng cooldown để tránh spam
    dependencies: {
        "pastebin-api": "",
        "cheerio": "",
        "request": "",
        "axios": "", // Thêm axios vào dependencies nếu chưa có
        "fs-extra": "" // Thêm fs-extra để đồng bộ với onLoad, mặc dù đã có fs
    },
};

module.exports.run = async function({
    api,
    event,
    args
}) {
    const moment = require("moment-timezone");
    const axios = require("axios");
    const fs = require("fs-extra"); // Dùng fs-extra thay vì fs thuần
    const request = require("request");
    const cheerio = require("cheerio");
    const {
        join,
        resolve
    } = require("path");

    const {
        senderID,
        threadID,
        messageID,
        messageReply,
        type
    } = event;

    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / (60 * 60));
    const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
    const seconds = Math.floor(uptimeSeconds % 60);

    const NDH_ID = global.config.NDH[0]; // Lấy NDH đầu tiên, hoặc có thể check toàn bộ NDH nếu muốn
    const isAdmin = global.config.ADMINBOT.includes(senderID); // Kiểm tra xem người dùng có phải ADMINBOT không
    const isNDH = global.config.NDH.includes(senderID); // Kiểm tra xem người dùng có phải NDH không

    // Nếu không phải ADMINBOT hoặc NDH, gửi cảnh báo
    if (!isAdmin && !isNDH) {
        const userName = global.data.userName.get(senderID);
        const threadInfo = await api.getThreadInfo(threadID);
        const threadName = threadInfo.threadName;
        const currentTime = moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss (DD/MM/YYYY) (dddd)");

        api.sendMessage(
            `🚨 **Cảnh báo!** Thành viên "${userName}" (UID: ${senderID}) từ nhóm "${threadName}" đã cố gắng sử dụng lệnh "ghichu"!\n\nThời gian: ${currentTime}`,
            NDH_ID // Gửi thông báo đến NDH
        );
        return api.sendMessage(
            "🚫 **Lệnh này chỉ dành cho Admin và Người điều hành bot!** Hành vi này đã được báo cáo rồi đó! 😠",
            threadID,
            messageID
        );
    }

    const firstArg = args[0] ? args[0].toLowerCase() : '';
    let fileName = '';
    let linkToProcess = '';

    // Xử lý khi có reply tin nhắn
    if (type === "message_reply" && messageReply.body) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = messageReply.body.match(urlRegex);
        if (match && match.length > 0) {
            linkToProcess = match[0];
            fileName = firstArg; // Lấy tên file từ args[0]
            if (!fileName) {
                return api.sendMessage("💡 Bạn muốn lưu file này với tên gì? Hãy nhập tên file vào nhé! Ví dụ: `ghichu [tên_file]` 🦄💜", threadID, messageID);
            }
        }
    } else if (firstArg) {
        // Xử lý khi không reply nhưng có truyền args[0]
        fileName = firstArg;
    }


    // Nếu không có tên file hoặc link để xử lý, hiển thị menu hướng dẫn
    if (!fileName && !linkToProcess) {
        const imageUrl = (await axios.get("https://api-images.duytrollgame.repl.co/rin.php")).data.data; // Lấy ảnh từ API

        return api.sendMessage({
            body: `✨ **CHÀO MỪNG ĐẾN VỚI LỆNH GHI CHÚ!** ✨
━━━━━━━━━━━━━━━━━━
⏰ Bot đã online được **${hours} giờ ${minutes} phút ${seconds} giây**
🗓️ Thời gian hiện tại: ${moment().tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY")}
━━━━━━━━━━━━━━━━━━
🦄 **MENU HƯỚNG DẪN:** 🦄

**1.** **Tải code về máy bot:**
   Reply một **link code** (Pastebin, GitHub, Buildtool, Google Drive) và dùng lệnh:
   \`\`\`
   ${global.config.PREFIX}ghichu [tên_file_của_bạn]
   \`\`\`
   *(Ví dụ: Reply link Pastebin và gõ ${global.config.PREFIX}ghichu mycommand)*

**2.** **Upload code lên Pastebin:**
   Gõ lệnh kèm theo **tên file code** có sẵn trong bot:
   \`\`\`
   ${global.config.PREFIX}ghichu [tên_file_có_sẵn] [tên_trên_pastebin (tùy chọn)]
   \`\`\`
   *(Ví dụ: ${global.config.PREFIX}ghichu test_cmd MyCoolCommand)*

Hãy tận dụng tối đa sức mạnh của bot nha! 💜`,
            attachment: (await axios.get(imageUrl, { responseType: "stream" })).data,
        }, threadID, messageID);
    }

    // --- Xử lý tải code từ link ---
    if (linkToProcess) {
        const filePath = resolve(__dirname, `${fileName}.js`);
        if (linkToProcess.includes("pastebin.com") || linkToProcess.includes("github.com") || linkToProcess.includes("phamvandien.com")) {
            try {
                const response = await axios.get(linkToProcess);
                await fs.writeFile(filePath, response.data, "utf-8");
                return api.sendMessage(`✅ Đã tải code từ link và lưu thành **${fileName}.js**! Dùng lệnh \`load ${fileName}\` để sử dụng nha! 🚀🦄💜`, threadID, messageID);
            } catch (error) {
                console.error("Lỗi khi tải code từ link (Pastebin/GitHub/PhamVanDien):", error);
                return api.sendMessage(`❌ Ôi không! Có lỗi xảy ra khi tải code từ link **${linkToProcess}**! Vui lòng kiểm tra lại link hoặc thử lại sau nhé. 😥`, threadID, messageID);
            }
        } else if (linkToProcess.includes("buildtool.dev") || linkToProcess.includes("tinyurl.com")) {
            request({
                method: "GET",
                url: linkToProcess,
            }, function(error, response, body) {
                if (error) {
                    console.error("Lỗi khi request từ buildtool/tinyurl:", error);
                    return api.sendMessage("❌ Lỗi! Vui lòng chỉ reply link (không chứa gì khác ngoài link) hoặc kiểm tra lại link Buildtool/Tinyurl. 😥", threadID, messageID);
                }
                const $ = cheerio.load(body);
                const code = $('.language-js').first().text(); // Lấy nội dung code đầu tiên
                if (!code) {
                    return api.sendMessage("🔍 Không tìm thấy đoạn code JS nào trong link Buildtool/Tinyurl bạn cung cấp. Đảm bảo link chứa code JS nhé! 🦄", threadID, messageID);
                }
                fs.writeFile(filePath, code, "utf-8", (err) => {
                    if (err) {
                        console.error("Lỗi khi ghi file từ buildtool/tinyurl:", err);
                        return api.sendMessage(`❌ Đã xảy ra lỗi khi áp dụng code mới cho **${fileName}.js**! 😥`, threadID, messageID);
                    }
                    return api.sendMessage(`✅ Đã tải code từ Buildtool/Tinyurl và lưu thành **${fileName}.js**! Dùng lệnh \`load ${fileName}\` để sử dụng nha! 🚀🦄💜`, threadID, messageID);
                });
            });
        } else if (linkToProcess.includes("drive.google.com")) {
            const driveIdMatch = linkToProcess.match(/[-\w]{25,}/);
            const driveId = driveIdMatch ? driveIdMatch[0] : null;

            if (!driveId) {
                return api.sendMessage("❗ Không tìm thấy ID file Google Drive hợp lệ trong link. Vui lòng kiểm tra lại link nhé! 🦄💜", threadID, messageID);
            }

            try {
                // Sử dụng downloadFile nếu có sẵn, hoặc tự implement nếu không
                // Hiện tại không có global.utils.downloadFile nên sẽ dùng axios
                const driveLink = `https://docs.google.com/uc?export=download&id=${driveId}`;
                const response = await axios.get(driveLink, { responseType