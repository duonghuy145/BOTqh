const axios = require("axios");
const fs = require("fs-nextra");
const path = require("path");

module.exports.config = {
    name: "ghép",
    version: "1.0.2", // Nâng version lên xíu nữa ⬆️
    hasPermssion: 0,
    credits: "modded by qh and Gemini ✨",
    description: "tìm một nửa định mệnh cho bạn trong nhóm! ❤️‍🔥", // Viết hoa đầu dòng + icon
    commandCategory: "game 🎲", // Viết hoa đầu dòng + icon
    usages: "",
    cooldowns: 10
};

const LOVE_QUOTES = [
    "Chúc 2 bạn trăm năm hạnh phúc. 💖",
    "Chúc 2 bạn xây dựng được một tổ ấm hạnh phúc. 🏡",
    "Chúc 2 bạn cùng nhau nương tựa đến cuối đời. 💑",
    "Chúc 2 bạn hạnh phúc. ✨",
    "Trách phận vô duyên... 😔",
    "Hơi thấp nhưng không sao. Hãy cố gắng lên! 💪",
    "3 phần duyên nợ, 7 phần cố gắng. 🌱",
    "Tỷ lệ mà mối quan hệ này có thể nên duyên cũng khá là nhỏ đấy! Phải cố gắng hơn nữa. 😬",
    "Date với nhau đi. Để mối quan hệ này có thể tiến xa hơn. 😉",
    "Hãy chủ động bắt chuyện hơn nữa. Hai bạn khá là hợp đôi đó! 🥰",
    "Hãy tin vào duyên số đi, vì nó có thật đấy! 🍀",
    "Hợp đôi lắm đấy. Quan tâm chăm sóc cho mối quan hệ này nhiều hơn nữa nhé! 💘",
    "Lưu số nhau đi, bao giờ cưới thì gọi nhau lên lễ đường! 👰🤵",
    "Cưới đi chờ chi! 💍"
];

module.exports.run = async function({ api, event, Threads, Users }) {
    const { threadID, messageID, senderID } = event;

    api.sendMessage("Đang tìm một nửa của bạn... Chờ chút nhé! 💫", threadID, messageID); // Viết hoa đầu dòng + icon

    try {
        const threadInfo = await Threads.getInfo(threadID);
        const listUserID = threadInfo.participantIDs.filter(ID => ID !== api.getCurrentUserID() && ID !== senderID);

        if (listUserID.length === 0) {
            return api.sendMessage("Rất tiếc, không tìm thấy thành viên nào khác trong nhóm để ghép đôi với bạn. 💔", threadID, messageID); // Viết hoa đầu dòng + icon
        }

        const matchedMemberID = listUserID[Math.floor(Math.random() * listUserID.length)];

        const senderInfo = await Users.getData(senderID);
        const senderName = senderInfo.name;

        const matchedMemberInfo = await Users.getData(matchedMemberID);
        const matchedMemberName = matchedMemberInfo.name;

        const matchPercentage = Math.floor(Math.random() * 101);
        const randomQuote = LOVE_QUOTES[Math.floor(Math.random() * LOVE_QUOTES.length)];

        const arraytag = [
            { id: senderID, tag: senderName },
            { id: matchedMemberID, tag: matchedMemberName }
        ];

        const attachments = [];
        const cacheDir = path.resolve(__dirname, "cache");
        if (!fs.existsSync(cacheDir)) {
            await fs.mkdir(cacheDir);
        }

        let avatarPaths = [];
        try {
            const senderAvatarData = await Users.getInfo(senderID);
            const senderAvatarUrl = senderAvatarData.profilePicture;

            const matchedAvatarData = await Users.getInfo(matchedMemberID);
            const matchedAvatarUrl = matchedAvatarData.profilePicture;

            if (senderAvatarUrl) {
                const avatar1Path = path.join(cacheDir, `${senderID}_avatar.png`);
                await axios.get(senderAvatarUrl, { responseType: 'stream' }).then(res => res.data.pipe(fs.createWriteStream(avatar1Path)));
                avatarPaths.push(avatar1Path);
            }
            if (matchedAvatarUrl) {
                const avatar2Path = path.join(cacheDir, `${matchedMemberID}_avatar.png`);
                await axios.get(matchedAvatarUrl, { responseType: 'stream' }).then(res => res.data.pipe(fs.createWriteStream(avatar2Path)));
                avatarPaths.push(avatar2Path);
            }
        } catch (err) {
            console.error("Lỗi khi tải avatar, có thể do link không hợp lệ hoặc api bị giới hạn:", err); // Viết hoa đầu dòng
        }

        const gifLovePath = path.join(cacheDir, "giflove.gif");
        try {
            const gifResponse = await axios.get("https://i.ibb.co/wC2JJBb/trai-tim-lap-lanh.gif", { responseType: "stream" });
            await new Promise((resolve, reject) => {
                gifResponse.data.pipe(fs.createWriteStream(gifLovePath))
                    .on('finish', resolve)
                    .on('error', reject);
            });
            attachments.push(fs.createReadStream(gifLovePath));
        } catch (err) {
            console.error("Lỗi khi tải gif tình yêu:", err); // Viết hoa đầu dòng
        }

        for (const p of avatarPaths) {
            attachments.push(fs.createReadStream(p));
        }

        const message = {
            body: `[ 🥰 ]→ Ghép đôi thành công!\n[ ❤️ ]→ Lời chúc: ${randomQuote}\n[ 💕 ]→ Tỉ lệ hợp đôi: ${matchPercentage}%\n\n${senderName} 💖 ${matchedMemberName}\n\nChúc hai bạn hạnh phúc nhé! 🥳`, // Viết hoa đầu dòng + icon
            mentions: arraytag,
            attachment: attachments.length > 0 ? attachments : null
        };

        api.sendMessage(message, threadID, async () => {
            for (const p of avatarPaths) {
                await fs.unlink(p).catch(err => console.error("Lỗi khi xóa avatar cache:", err)); // Viết hoa đầu dòng
            }
            if (fs.existsSync(gifLovePath)) {
                await fs.unlink(gifLovePath).catch(err => console.error("Lỗi khi xóa gif cache:", err)); // Viết hoa đầu dòng
            }
        }, messageID);

    } catch (error) {
        console.error("Lỗi xảy ra khi xử lý lệnh ghép đôi:", error); // Viết hoa đầu dòng
        api.sendMessage("Ôi kìa! Đã có lỗi xảy ra trong quá trình ghép đôi. Vui lòng thử lại sau. 😥", threadID, messageID); // Viết hoa đầu dòng + icon
    }
};