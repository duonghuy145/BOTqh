const request = require("request");
const cheerio = require("cheerio");
const axios = require("axios");
const fs = require("fs-nextra"); // 🚀 Sử dụng fs-nextra để tận dụng Promise-based file operations
const path = require('path'); // Thêm path để quản lý đường dẫn file cache

// ⏰ Hàm chuyển đổi thời gian sang định dạng đẹp hơn
function convert(time) {
    const date = new Date(`${time}`);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const formattedDate =
        `${hours < 10 ? "0" + hours : hours}` +
        ":" +
        `${minutes < 10 ? "0" + minutes : minutes}` +
        ":" +
        `${seconds < 10 ? "0" + seconds : seconds}` +
        ` 📅 ` + // 💡 Thêm icon
        `${day < 10 ? "0" + day : day}` +
        "/" +
        `${month < 10 ? "0" + month : month}` +
        "/" +
        year;
    return formattedDate;
}

// 💬 Hàm lấy tiểu sử người dùng
async function getBio(uid, api) {
    if (!uid) return "Không có thông tin tiểu sử. 🤷‍♀️"; // 💖 Rút gọn và thêm icon
    const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "ProfileCometBioTextEditorPrivacyIconQuery",
        fb_api_caller_class: "RelayModern",
        doc_id: "5009284572488938",
        variables: JSON.stringify({
            id: uid,
        }),
    };
    try {
        const src = await api.httpPost("https://www.facebook.com/api/graphql/", form);
        const bio = JSON.parse(src).data?.user?.profile_intro_card;
        return bio?.bio ? bio.bio?.text : "Không có thông tin tiểu sử. 🤷‍♀️"; // 💖 Rút gọn và thêm icon
    } catch (e) {
        console.error("❌ Lỗi khi lấy tiểu sử:", e); // Sửa lỗi console.log và thêm icon
        return "Không có thông tin tiểu sử. 🤷‍♀️"; // 💖 Rút gọn và thêm icon
    }
}

// 🏞️ Hàm lấy ảnh bìa profile
async function getProfileCoverPhoto(uid) {
    try {
        const { data } = await axios.get("https://www.facebook.com/" + uid, {
            headers: {
                cookie: global.cookie,
            },
        });
        const regex = /<img[^>]*data-imgperflogname="profileCoverPhoto"[^>]*src="([^"]+)"/i;
        const matches = data.match(regex);
        if (matches && matches.length > 1) {
            return matches[1];
        } else {
            return "Không có ảnh bìa. 🖼️"; // 💖 Rút gọn và thêm icon
        }
    } catch (e) {
        console.error("❌ Lỗi khi lấy ảnh bìa:", e); // Thêm icon
        return "Không có ảnh bìa. 🖼️"; // 💖 Rút gọn và thêm icon
    }
}

// 🌐 Hàm kiểm tra URL hợp lệ
function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

module.exports.config = {
    name: "info",
    version: "3.0.2", // ⬆️ Nâng version sau khi mod
    hasPermssion: 0,
    credits: "Deku mod by Niio-team và những chú lợn - modded by qh and Gemini ✨", // 💖 Thêm credit qh và Gemini
    description: "🕵️‍♀️ Xem thông tin chi tiết của người dùng Facebook. 📊", // 💖 Thêm nhiều icon và súc tích
    usages: "[reply/uid/link/@tag]",
    commandCategory: "tiện ích 🛠️", // 🌟 Chuyển về chữ thường + icon
    cooldowns: 7, // ⏰ Tăng cooldown lên 7s để tránh quá tải API
    dependencies: {
        "pastebin-api": "", // Giữ nguyên dependency cũ nếu cần, hoặc có thể xóa nếu không dùng
        "cheerio": "",
        "request": "",
        "axios": "",
        "fs-nextra": "" // 🚀 Đảm bảo dùng fs-nextra
    },
};

module.exports.run = async function({
    api,
    event,
    args,
    client,
    Users,
    Currencies,
    permssion,
}) {
    const cacheDir = path.join(__dirname, 'cache');
    const token = global.config.ACCESSTOKEN;
    let targetID;

    // ⚙️ Kiểm tra và tạo thư mục cache nếu chưa có
    if (!await fs.exists(cacheDir)) { // ✅ Sử dụng await fs.exists()
        await fs.mkdir(cacheDir); // ✅ Sử dụng await fs.mkdir()
    }

    // 🎯 Lấy UID từ tag, link, hoặc input trực tiếp
    if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0].replace(/\&mibextid=ZbWKwL/g, ""); // 🚀 Loại bỏ đoạn thừa trong UID nếu có
    } else if (event.type === "message_reply") {
        targetID = event.messageReply.senderID;
    } else if (args[0]) {
        if (isValidURL(args[0])) {
            targetID = await global.utils.getUID(args[0]);
        } else if (!isNaN(args[0])) {
            targetID = args[0];
        } else {
            return api.sendMessage(
                "❗ Đầu vào không hợp lệ! Vui lòng tag, reply tin nhắn, nhập UID hoặc link profile. 📲", // 💖 Thêm icon
                event.threadID,
                event.messageID
            );
        }
    } else {
        targetID = event.senderID; // Mặc định là senderID nếu không có input
    }

    if (!targetID) {
        return api.sendMessage(
            "❌ Không thể tìm thấy ID người dùng. Vui lòng thử lại! 🔍", // 💖 Thêm icon
            event.threadID,
            event.messageID
        );
    }

    let processingMessageID; // Biến để lưu messageID của tin nhắn đang xử lý

    try {
        // ⏳ Gửi tin nhắn "Đang thu thập thông tin..."
        processingMessageID = (await api.sendMessage("⏳ Đang thu thập thông tin... Chờ chút nha! ✨", event.threadID)).messageID;

        const resp = await axios.get(
            `https://graph.facebook.com/${targetID}?fields=id,is_verified,cover,updated_time,work,education,likes,created_time,posts,hometown,username,family,timezone,link,name,locale,location,about,website,birthday,gender,relationship_status,significant_other,quotes,first_name,subscribers.limit(0)&access_token=${token}`
        );

        const data = resp.data;

        // Trích xuất và định dạng thông tin
        const name = data.name;
        const link_profile = data.link;
        const bio = await getBio(targetID, api);
        const uid = data.id;
        const first_name = data.first_name;
        const username = data.username || "Không có username. 👤"; // 💖 Rút gọn tin nhắn và thêm icon
        const created_time = convert(data.created_time);
        const web = data.website || "Không có website. 🔗";
        const gender = data.gender === "male" ? "Nam ♂️" : data.gender === "female" ? "Nữ ♀️" : "Không xác định ❔"; // 💖 Thêm icon và làm rõ hơn
        const relationship_status = data.relationship_status || "Chưa cập nhật. 💔"; // 💖 Rút gọn tin nhắn
        const rela = data.significant_other?.name;
        const id_rela = data.significant_other?.id;
        const bday = data.birthday || "Chưa cập nhật. 🎂";
        const follower = (data.subscribers?.summary?.total_count || 0).toLocaleString(); // 💖 Định dạng số đẹp hơn
        const is_verified = data.is_verified ? "Đã xác minh ✅" : "Chưa xác minh ❌"; // 💖 Thêm icon
        const quotes = data.quotes || "Không có trích dẫn yêu thích. 💬";
        const about = data.about || "Chưa có thông tin giới thiệu. 📄";
        const locale = data.locale || "Không rõ. 🗺️";
        const hometown = data.hometown?.name || "Chưa cập nhật. 🏡";
        const cover = data.cover?.source || "Không có ảnh bìa. 🖼️";
        const ban = global.data.userBanned.has(uid) ? "Đang bị cấm ⛔" : "Không bị cấm ✅"; // 💖 Thêm icon
        const money = ((await Currencies.getData(uid)) || {}).money || 0;

        // Xử lý thông tin phức tạp hơn
        let workInfo = "Chưa cập nhật thông tin công việc. 💼"; // 💖 Thêm icon
        if (data.work && data.work.length > 0) {
            workInfo = data.work.map((wks, idx) =>
                `  ${idx + 1}. 🏢 ${wks.employer.name}` + (wks.position ? ` (${wks.position.name})` : '') + `\n   🔗 Link: https://www.facebook.com/${wks.id}`
            ).join('\n');
        }

        let likedPages = "Chưa thích trang nào công khai. 👍"; // 💖 Thêm icon
        if (data.likes && data.likes.data.length > 0) {
            likedPages = data.likes.data.slice(0, 5).map((lks, idx) =>
                `  ${idx + 1}. ✨ ${lks.name} (${lks.category})\n   ⏰ Theo dõi từ: ${convert(lks.created_time)}\n   🔗 Link: https://www.facebook.com/profile.php?id=${lks.id}`
            ).join('\n');
        }

        let recentPosts = "Không có bài đăng gần đây. 📰"; // 💖 Thêm icon
        // Dữ liệu posts sẽ được lấy khi handle reaction, không cần ở đây

        let familyMembers = "Chưa có thành viên gia đình công khai. 👨‍👩‍👧‍👦"; // 💖 Thêm icon
        if (data.family && data.family.data.length > 0) {
            familyMembers = (await Promise.all(data.family.data.map(async (fmb, idx) => {
                // Sử dụng API dịch thuật nếu cần, nhưng API googleapis.com này có thể bị rate limit
                // hoặc yêu cầu API key. Tạm thời giữ lại, nếu lỗi thì cần thay thế.
                let translatedRelation = fmb.relationship;
                try {
                     const transRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(fmb.relationship)}`);
                     translatedRelation = transRes.data[0][0][0];
                } catch (transError) {
                    console.warn("Lỗi dịch mối quan hệ:", transError.message);
                }
                return `  ${idx + 1}. 👨‍👩‍👧‍👦 ${fmb.name} (${translatedRelation})\n   🔗 Link: https://www.facebook.com/profile.php?id=${fmb.id}`;
            }))).join('\n');
        }

        let educationInfo = "Chưa cập nhật thông tin học vấn. 🎓"; // 💖 Thêm icon
        if (data.education && data.education.length > 0) {
            educationInfo = (await Promise.all(data.education.map(async (edt, idx) => {
                let translatedType = edt.type;
                try {
                     const transRes = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(edt.type)}`);
                     translatedType = transRes.data[0][0][0];
                } catch (transError) {
                    console.warn("Lỗi dịch loại học vấn:", transError.message);
                }
                return `  ${idx + 1}. 🏫 ${edt.school.name}` + (edt.type ? ` (${translatedType})` : '') + (edt.year?.name ? ` năm ${edt.year.name}` : '');
            }))).join('\n');
        }

        // Tải ảnh đại diện và ảnh bìa
        const avatarUrl = `https://graph.facebook.com/${targetID}/picture?width=1500&height=1500&access_token=${token}`;
        const coverPhotoUrl = await getProfileCoverPhoto(targetID); // Lấy ảnh bìa

        let attachments = [];
        let avatarPath = path.join(cacheDir, `avatar_${targetID}.jpg`);
        let coverPath = path.join(cacheDir, `cover_${targetID}.jpg`);

        try {
            const avatarResponse = await axios.get(avatarUrl, { responseType: "arraybuffer" });
            await fs.writeFile(avatarPath, Buffer.from(avatarResponse.data, "binary"));
            attachments.push(fs.createReadStream(avatarPath));
        } catch (e) {
            console.error("❌ Lỗi tải avatar:", e);
        }

        if (coverPhotoUrl && coverPhotoUrl !== "Không có ảnh bìa. 🖼️") { // So sánh đúng chuỗi trả về từ hàm
            try {
                const coverResponse = await axios.get(coverPhotoUrl, { responseType: "arraybuffer" });
                await fs.writeFile(coverPath, Buffer.from(coverResponse.data, "binary"));
                attachments.push(fs.createReadStream(coverPath));
            } catch (e) {
                console.error("❌ Lỗi tải cover photo:", e);
            }
        }


        // 📝 Gửi tin nhắn chứa thông tin
        let message = `
🌟 **THÔNG TIN CÁ NHÂN CỦA ${name.toUpperCase()}** 🌟
━━━━━━━━━━━━━━━━━━
👤 **Tên đầy đủ:** ${name} (${first_name})
🌐 **UID:** ${uid}
🔗 **Link Profile:** ${link_profile}
🆔 **Username:** ${username}
🎂 **Ngày sinh:** ${bday}
🗓️ **Ngày tạo tài khoản:** ${created_time}
🚻 **Giới tính:** ${gender}
💬 **Tiểu sử:** ${bio}
🏡 **Quê quán:** ${hometown}
💖 **Tình trạng mối quan hệ:** ${relationship_status}${rela ? ` với ${rela}` : ''}${id_rela ? `\n   🔗 Link người liên quan: https://www.facebook.com/profile.php?id=${id_rela}` : ''}
👀 **Người theo dõi:** ${follower}
✅ **Trạng thái xác minh:** ${is_verified}
📝 **Trích dẫn yêu thích:** ${quotes}
ℹ️ **Thông tin giới thiệu:** ${about}
🗺️ **Ngôn ngữ/Vùng:** ${locale}
🌐 **Website:** ${web}

💼 **Thông tin công việc:**
${workInfo}

🎓 **Thông tin học vấn:**
${educationInfo}

👨‍👩‍👧‍👦 **Thành viên gia đình:**
${familyMembers}

👍 **Các trang đã thích (Top 5):**
${likedPages}

💰 **Số tiền trong bot:** ${money.toLocaleString()} $
🚫 **Trạng thái cấm bot:** ${ban}

🔄 **Cập nhật cuối cùng:** ${convert(data.updated_time)}
⏰ **Múi giờ:** ${data.timezone}

━━━━━━━━━━━━━━━━━━
👇 **Thả cảm xúc bất kỳ vào tin nhắn này để xem các bài đăng gần đây của ${first_name}!** 👇
`;

        await api.sendMessage({
            body: message,
            attachment: attachments
        },
            event.threadID,
            (e, info) => {
                if (e) {
                    console.error("❌ Lỗi gửi tin nhắn info:", e); // Thêm icon
                    return api.sendMessage("❌ Đã xảy ra lỗi khi gửi thông tin! Vui lòng thử lại. 😟", event.threadID, event.messageID); // 💖 Thêm icon
                }
                // Xóa tin nhắn "đang xử lý"
                if (processingMessageID) {
                    api.unsendMessage(processingMessageID).catch(err => console.error("Lỗi khi xóa tin nhắn đang xử lý:", err));
                }
                // Lưu handleReaction
                global.client.handleReaction.push({
                    name: exports.config.name,
                    messageID: info.messageID,
                    author: targetID,
                });
            }
        );

    } catch (e) {
        console.error("❌ Lỗi trong hàm run của info:", e); // Thêm icon
        api.sendMessage(`❌ Đã xảy ra lỗi khi lấy thông tin người dùng: ${e.message}. Vui lòng kiểm tra lại UID/link hoặc thử lại sau! 😔`, event.threadID, event.messageID); // 💖 Thêm icon
        // Xóa tin nhắn "đang xử lý" nếu lỗi xảy ra trước khi gửi tin nhắn cuối cùng
        if (processingMessageID) {
            api.unsendMessage(processingMessageID).catch(err => console.error("Lỗi khi xóa tin nhắn đang xử lý (khi lỗi):", err));
        }
    } finally {
        // 🗑️ Luôn luôn xóa các file ảnh cache
        const filesToUnlink = [
            path.join(cacheDir, `avatar_${targetID}.jpg`),
            path.join(cacheDir, `cover_${targetID}.jpg`)
        ];
        for (const file of filesToUnlink) {
            if (await fs.exists(file)) {
                await fs.unlink(file).catch(err => console.error("Lỗi khi xóa file cache:", err));
            }
        }
    }
};

module.exports.handleReaction = async function({
    api,
    event: e,
    handleReaction
}) {
    // ⚙️ Chỉ xử lý nếu reaction đến từ người đã gửi lệnh hoặc admin/NDH
    const isAdmin = global.config.ADMINBOT.includes(e.senderID);
    const isNDH = global.config.NDH.includes(e.senderID);
    if (e.senderID !== handleReaction.author && !isAdmin && !isNDH) {
        return; // Bỏ qua nếu không phải người gửi lệnh hoặc admin/NDH
    }

    const send = (msg) => api.sendMessage(msg, e.threadID, e.messageID);

    try {
        const resp = await axios.get(
            `https://graph.facebook.com/${handleReaction.author}?fields=id,posts&access_token=${global.config.ACCESSTOKEN}`
        );
        const { posts } = resp.data;

        if (!posts || !posts.data || posts.data.length === 0) { // 🔍 Kiểm tra chặt chẽ hơn
            return send("🙁 Người dùng này không có bài đăng công khai nào hoặc Gemini không thể truy cập được. 🔐"); // 💖 Thêm icon
        }

        let p = "📰 **BÀI ĐĂNG GẦN ĐÂY** 📰\n━━━━━━━━━━━━━━━━━━\n";
        // 🔢 Giới hạn số bài đăng hiển thị
        const numPostsToShow = Math.min(posts.data.length, 5); // Chỉ hiển thị tối đa 5 bài

        for (let i = 0; i < numPostsToShow; i++) {
            const {
                created_time: c_t,
                message: ms,
                actions,
                privacy,
                shares,
                status_type: s_t,
            } = posts.data[i];

            const sr = shares?.count || 0;
            const pv = privacy?.description || "Không rõ";
            const a_l = actions?.[0]?.link || "Không có link";

            p += `
📌 **Bài viết #${i + 1}**
⏰ **Thời gian:** ${convert(c_t)}
📝 **Nội dung:** ${ms || '*(Không có nội dung)*'}
👁️ **Hiển thị:** ${pv}
🔄 **Chia sẻ:** ${sr} lượt
ℹ️ **Loại:** ${s_t || 'Không rõ'}
🔗 **Link:** ${a_l}
${i < numPostsToShow - 1 ? '━━━━━━━━━━━━━━━━━━' : ''}
`;
        }
        return send(p + "\n\n✨ **Đó là những bài đăng gần đây nhất của người dùng này!**"); // 💖 Thêm icon
    } catch (error) {
        console.error("❌ Lỗi trong handleReaction của info:", error); // Thêm icon
        return send(`❌ Đã xảy ra lỗi khi lấy danh sách bài đăng: ${error.message}. Vui lòng thử lại sau! 😔`); // 💖 Thêm icon
    }
};