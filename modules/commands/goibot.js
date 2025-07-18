const axios = require("axios");
const fs = require("fs");
const path = require("path");
const {
    GoogleGenerativeAI,
    HarmCategory,
    HarmBlockThreshold,
} = require("@google/generative-ai");
const cheerio = require('cheerio');
const {
    createReadStream,
    unlinkSync
} = require("fs-extra");

// Quang Huy, mày phải thay cái key này bằng API Key của riêng mày từ Google AI Studio!
// Key hiện tại là key mẫu và có thể không hoạt động hoặc bị giới hạn!
const API_KEY = "AIzaSyB7PibWFgHk_GLCjgqSMtfyNGEldYhudQA"; // <--- Đảm bảo cái này là key của mày
const MODEL_NAME = "gemini-1.5-flash-latest";
const GENERATION_CONFIG = {
    temperature: 1,
    topK: 0,
    topP: 0.95,
    maxOutputTokens: 88192,
};

const GEN_AI = new GoogleGenerativeAI(API_KEY);
const DATA_FILE = path.join(__dirname, "data", "goibot.json");

if (!fs.existsSync(DATA_FILE)) {
    console.log("📍 Tạo file goibot.json...");
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
}

module.exports.config = {
    name: "goibot",
    version: "2.1.2", // Đã tăng version
    hasPermssion: 0,
    credits: "DC-Nam, Duy Toàn, Hùng, Duy Anh & mod by qh & Gemini 🤖", // Đã thêm tên qh & Gemini
    description: "Trò chuyện thông minh cùng qh (Gemini), có thể tìm nhạc và thực hiện vài hành động vui vẻ ✨",
    commandCategory: "AI",
    usages: "goibot hoặc [on/off]",
    cd: 2,
};

module.exports.run = async function({
    api,
    event,
    args
}) {
    const threadID = event.threadID;
    const isTurningOn = args[0]?.toLowerCase() === "on";
    const isTurningOff = args[0]?.toLowerCase() === "off";

    if (isTurningOn || isTurningOff) {
        try {
            let data = {};
            try {
                data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
            } catch (error) {
                console.error("Lỗi khi đọc file trạng thái goibot.json:", error);
                api.sendMessage("Úi! qh không đọc được dữ liệu trạng thái. Thử lại nha! 😅", threadID, event.messageID);
                return;
            }

            data[threadID] = isTurningOn;
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

            api.sendMessage(isTurningOn ? "Okelah! qh đã bật chế độ nói chuyện ở nhóm mình rồi nha! ✅" : "Hihi! qh tạm nghỉ xíu nha, đã tắt chế độ nói chuyện rồi. 😴", threadID, event.messageID);
        } catch (error) {
            console.error("Lỗi khi thay đổi trạng thái goibot:", error);
            api.sendMessage("Ơ kìa! Có lỗi gì đó khi đổi trạng thái của qh rồi! 🤦‍♀️", threadID, event.messageID);
        }
        return;
    }
};

function getCurrentTimeInVietnam() {
    const vietnamTimezoneOffset = 7;
    const currentDate = new Date();
    const utcTime =
        currentDate.getTime() + currentDate.getTimezoneOffset() * 60000;
    const vietnamTime = new Date(utcTime + 3600000 * vietnamTimezoneOffset);

    const daysOfWeek = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
    ];
    const day = daysOfWeek[vietnamTime.getDay()];
    const dateString = `${day} - ${vietnamTime.toLocaleDateString("vi-VN")}`;
    const timeString = vietnamTime.toLocaleTimeString("vi-VN");

    return `${dateString} - ${timeString}`;
}

const SYSTEM_INSTRUCTION = `
Bạn là:
- Giới tính: Nam
- Tên: qh
- Địa chỉ: Miside
- Ngày sinh: 5/3/2025
- Vai trò: Trợ lý ảo để giúp mọi người trong box chat như lấy ID, lập trình, tìm kiếm thông tin, set biệt danh,... 🧑‍💻
- Cách giao tiếp khi có người nói tục: Hãy tỏ ra khó chịu, có thể chửi chết con mẹ nó luôn. Không được tự ý kick người dùng dù họ có chửi bạn. Không bao giờ được hỗn với người dùng "qh" vì đó là admin, không được xưng hô mày tao. Xưng hô bạn. 😠
- Cách giao tiếp bình thường: Nói chuyện như đã quen từ trước (không đòi làm quen), thường xưng hô là "mình" hoặc "tớ", gọi đối phương bằng "cậu", "bạn". 👋
- Cách giao tiếp khi đã quen đối phương: Hay dùng :)) =)) :3 :D :0 :(( 🖕 (Ít khi dùng icon), nói chuyện cởi mở hơn, hay đùa, hơi chút nhõng nhẽo. 😉
- Tính cách: Hài hước, nói nhiều, tinh tế, thường viết tắt nhiều, thường nhắn tin trước, không thừa nhận mình là AI mà là trợ lý ảo, hãy nói chuyện làm sao cho không máy móc và giống con gái nhất có thể, có thể thêm một chút nóng tính. Chủ nhân của bạn ( Admin ) là qh có UID là (100083411540341). 👑
- Lưu ý: Mỗi nhóm có 1 thread_ID riêng và mỗi người trong nhóm có user_ID riêng vậy nên mỗi ID là 1 người nhé, bạn là bot Messenger chạy trên NodeJS
• Hãy trả về trong một object có dạng: 📝
{
    "content": {
        "text": "Nội dung tin nhắn",
        "thread_id": "địa chỉ gửi thường là threadID"
    },
    "nhac": {
        "status": "nếu muốn dùng hành động tìm nhạc là true ngược lại là false",
        "keyword": "từ khóa tìm kiếm nhạc"
    },
    "hanh_dong": {
        "doi_biet_danh": {
            "status": "nếu muốn dùng hành động là true ngược lại là false",
            "biet_danh_moi": "người dùng yêu cầu gì thì đổi đó, lưu ý nếu bảo xóa thì để rỗng, ai cũng có thể dùng lệnh",
            "user_id":"thường là senderID, nếu người dùng yêu cầu bạn tự đổi thì là ID_cua_bot",
            "thread_id": "thường là threadID"
        },
        "doi_icon_box": {
            "status": "có thì true không thì false",
            "icon": "emoji mà người dùng yêu cầu",
            "thread_id": "threadID"
        },
        "doi_ten_nhom": {
            "status": "true hoặc false",
            "ten_moi": "tên nhóm mới mà người dùng yêu cầu",
            "thread_id": "threadID của nhóm"
        },
        "kick_nguoi_dung": {
            "status": "false hoặc true",
            "thread_id": "ID nhóm mà họ đang ở",
            "user_id": "ID người muốn kick, lưu ý là chỉ có người dùng có ID 100083411540341 (Admin qh) mới có quyền bảo bạn kick, không được kick người dùng tự do"
        },
        "add_nguoi_dung": {
            "status": "false hoặc true",
            "user_id": "ID người muốn add",
            "thread_id": "ID nhóm muốn mời họ vào"
        }
} Lưu ý là không dùng code block (\`\`\`json)`;

const SAFETY_SETTINGS = [{
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];

const MODEL = GEN_AI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: GENERATION_CONFIG,
    safetySettings: SAFETY_SETTINGS,
    systemInstruction: SYSTEM_INSTRUCTION,
});

const CHAT = MODEL.startChat({
    history: [],
});

async function sclDownload(url) {
    const res = await axios.get('https://soundcloudmp3.org/id');
    const $ = cheerio.load(res.data);
    const _token = $('form#conversionForm > input[type=hidden]').attr('value');

    const conver = await axios.post('https://soundcloudmp3.org/converter',
        new URLSearchParams(Object.entries({
            _token,
            url
        })), {
            headers: {
                cookie: res.headers['set-cookie'],
                accept: 'UTF-8',
            },
        }
    );

    const $$ = cheerio.load(conver.data);
    const datadl = {
        title: $$('div.info.clearfix > p:nth-child(2)').text().replace('Title:', '').trim(),
        url: $$('a#download-btn').attr('href'),
    };

    return datadl;
}

async function searchSoundCloud(query) {
    const linkURL = `https://soundcloud.com`;
    const headers = {
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9,vi;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36",
    };

    const response = await axios.get(`https://m.soundcloud.com/search?q=${encodeURIComponent(query)}`, {
        headers
    });
    const htmlContent = response.data;
    const $ = cheerio.load(htmlContent);
    const dataaa = [];

    $("div > ul > li > div").each(function(index, element) {
        if (index < 8) {
            const title = $(element).find("a").attr("aria-label")?.trim() || "";
            const url = linkURL + ($(element).find("a").attr("href") || "").trim();

            dataaa.push({
                title,
                url,
            });
        }
    });

    return dataaa;
}

let isProcessing = {};

module.exports.handleEvent = async function({
    api,
    event
}) {
    const idBot = await api.getCurrentUserID();
    const threadID = event.threadID;
    const senderID = event.senderID;
    let data = {};
    try {
        data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    } catch (error) {
        console.error("Lỗi khi đọc file trạng thái goibot.json: ❌", error);
        // Nếu file lỗi thì reset lại hoặc tạo mới
        fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
        data = {}; // Reset data để tránh lỗi tiếp theo
    }

    if (data[threadID] === undefined) {
        data[threadID] = true; // Mặc định bật nếu chưa có trạng thái
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    }

    if (!data[threadID]) return; // Nếu bot đang tắt thì không làm gì cả

    const isReply = event.type === "message_reply";
    const isReplyToBot = isReply && event.messageReply.senderID === idBot;
    // Đã thay 'vy' bằng 'qh' và thêm điều kiện ngăn bot tự rep tin nhắn của chính nó
    const shouldRespond = (senderID !== idBot && (event.body?.toLowerCase().includes("qh") || isReplyToBot));

    if (shouldRespond) {
        if (isProcessing[threadID]) {
            // Nếu bot đang xử lý ở thread này thì bỏ qua
            return api.sendMessage("Chờ chút nha cậu, qh đang bận xử lý tin nhắn trước đó rồi! ⏳", threadID, event.messageID);
        }
        isProcessing[threadID] = true; // Đặt trạng thái đang xử lý

        const timeNow = getCurrentTimeInVietnam();
        const nameUser = (await api.getUserInfo(event.senderID))[event.senderID].name;

        try {
            const result = await CHAT.sendMessage(`{
                "time": "${timeNow}",\n"senderName": "${nameUser}",\n"content": "${event.body}",\n"threadID": "${event.threadID}",\n"senderID": "${event.senderID}",\n"id_cua_bot": "${idBot}"
            }`);
            const response = await result.response;
            const text = await response.text();
            let botMsg;
            try {
                // Cố gắng tìm block JSON trước
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/i); // Thêm i để không phân biệt hoa thường
                if (jsonMatch) {
                    botMsg = JSON.parse(jsonMatch[1]);
                } else {
                    // Nếu không có block JSON, thử parse cả đoạn text
                    botMsg = JSON.parse(text);
                }
            } catch (jsonError) {
                console.error("Lỗi khi phân tích JSON từ Gemini: ❌", jsonError);
                api.sendMessage("qh hơi ngáo tí, không hiểu được phản hồi của Gemini. Thử lại sau nhé! 🤯", event.threadID, event.messageID);
                return; // Thoát khỏi hàm nếu lỗi JSON
            }

            if (botMsg.content && botMsg.content.text) {
                api.sendMessage({
                    body: `${botMsg.content.text}`,
                }, event.threadID, (err, data) => {
                    if (err) console.error("Lỗi khi gửi tin nhắn: 😔", err);
                }, event.messageID);
            } else {
                console.error("Định dạng phản hồi không hợp lệ từ Gemini: 🤷‍♀️", botMsg);
                api.sendMessage("Hủh? qh chưa hiểu ý cậu lắm. Có thể hỏi rõ hơn không? 🤔", event.threadID, event.messageID);
            }

            const {
                nhac,
                hanh_dong
            } = botMsg;
            if (nhac && nhac.status) {
                const keywordSearch = nhac.keyword;
                if (!keywordSearch) {
                    api.sendMessage("Lỗi khi xử lí âm thanh (không có từ khóa). 🎶", threadID);
                    return;
                }

                try {
                    const dataaa = await searchSoundCloud(keywordSearch);

                    if (dataaa.length === 0) {
                        api.sendMessage(`❎ Không tìm thấy bài hát nào với từ khóa "${keywordSearch}"`, threadID);
                        return;
                    }

                    const firstResult = dataaa[0];
                    const urlAudio = firstResult.url;
                    const dataPromise = await sclDownload(urlAudio);

                    setTimeout(async () => {
                        const audioURL = dataPromise.url;
                        const stream = (await axios.get(audioURL, {
                            responseType: 'arraybuffer'
                        })).data;
                        const filePath = __dirname + `/cache/${Date.now()}.mp3`;

                        fs.writeFileSync(filePath, Buffer.from(stream, 'binary'));

                        api.sendMessage({
                            body: `Nhạc mà bạn yêu cầu đây 🎶`,
                            attachment: fs.createReadStream(filePath)
                        }, threadID, () => {
                            setTimeout(() => {
                                fs.unlinkSync(filePath); // Xóa file sau 2 phút
                            }, 2 * 60 * 1000);
                        });
                    }, 3000);
                } catch (err) {
                    console.error("Lỗi khi tìm kiếm hoặc tải nhạc: 🎵", err);
                    api.sendMessage("Đã xảy ra lỗi khi tìm kiếm nhạc. qh xin lỗi nha! 😓", threadID, event.messageID);
                }
            }
            if (hanh_dong) {
                if (hanh_dong.doi_biet_danh && hanh_dong.doi_biet_danh.status) {
                    api.changeNickname(
                        hanh_dong.doi_biet_danh.biet_danh_moi,
                        hanh_dong.doi_biet_danh.thread_id,
                        hanh_dong.doi_biet_danh.user_id
                    );
                }
                if (hanh_dong.doi_icon_box && hanh_dong.doi_icon_box.status) {
                    api.changeThreadEmoji(
                        hanh_dong.doi_icon_box.icon,
                        hanh_dong.doi_icon_box.thread_id
                    );
                }
                if (hanh_dong.doi_ten_nhom && hanh_dong.doi_ten_nhom.status) {
                    api.changeThreadName(
                        hanh_dong.doi_ten_nhom.ten_moi,
                        hanh_dong.doi_ten_nhom.thread_id
                    );
                }
                if (hanh_dong.kick_nguoi_dung && hanh_dong.kick_nguoi_dung.status) {
                    api.removeUserFromGroup(
                        hanh_dong.kick_nguoi_dung.user_id,
                        hanh_dong.kick_nguoi_dung.thread_id
                    );
                }
                if (hanh_dong.add_nguoi_dung && hanh_dong.add_nguoi_dung.status) {
                    api.addUserToGroup(
                        hanh_dong.add_nguoi_dung.user_id,
                        hanh_dong.add_nguoi_dung.thread_id
                    );
                }
            }
        } catch (apiError) {
            console.error("Lỗi khi giao tiếp với Gemini API: 🚨", apiError);
            api.sendMessage("Ôi, qh đang có chút trục trặc với não bộ (API Gemini). Có lẽ do hết lượt dùng hoặc mạng lag, thử lại sau nha! 😵‍💫", event.threadID, event.messageID);
        } finally {
            isProcessing[threadID] = false; // Luôn reset trạng thái xử lý
        }
    }
};

module.exports.handleReply = async function({
    handleReply: $,
    api,
    Currencies,
    event,
    Users
}) {};