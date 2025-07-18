const axios = require("axios");
const moment = require('moment-timezone'); // Giữ nguyên moment-timezone nếu mày cần timezone cụ thể
const fs = require("fs-extra"); // Thêm fs-extra để quản lý file dễ hơn
const path = require("path"); // Thêm path để quản lý đường dẫn

// Thư mục cache
const cacheDir = path.join(__dirname, "cache");
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

this.config = {
    name: 'capcut',
    version: '1.2.0', // Tăng version lên
    hasPermssion: 0,
    credits: 'DongDev, qh và Gemini', // Cập nhật credits
    description: 'Tìm kiếm và tải video mẫu từ Capcut',
    commandCategory: 'Tìm kiếm',
    usages: 'capcut search <từ khóa>', // Sửa lại usages cho rõ ràng
    cooldowns: 5,
};

// Hàm streamURL sửa lại để trả về cả stream và path để xóa file tạm
let streamURL = async (url, ext = 'jpg') => {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const filePath = path.join(cacheDir, `${Date.now()}.${ext}`);
        await fs.writeFile(filePath, Buffer.from(response.data));
        return {
            stream: fs.createReadStream(filePath),
            path: filePath
        };
    } catch (e) {
        console.error(`Lỗi khi stream URL ${url}:`, e);
        return null;
    }
};

this.run = async function ({ api, event, args }) {
    const { threadID: tid, messageID: mid, senderID: sid } = event;
    const send = (content, tid, mid) => api.sendMessage(content, tid, mid);

    const command = args[0]?.toLowerCase(); // Lấy sub-command và chuyển về chữ thường

    if (!command || command !== 'search') { // Kiểm tra nếu không có command hoặc command không phải 'search'
        return send("Sai cú pháp rồi, Dùng đúng kiểu này nè: `capcut search <từ khóa>`", tid, mid);
    }

    const keyword = args.slice(1).join(" ");
    if (!keyword) {
        return send("Mày quên nhập từ khóa tìm kiếm kìa! Gõ thêm cái gì đó sau `capcut search` đi chứ.", tid, mid);
    }

    try {
        send("qh đang lùng sục Capcut cho mày đây, chờ xíu nhé...", tid, mid);
        const searchData = await getdata(keyword);

        if (!searchData || searchData.length === 0) {
            send(`qh tìm mãi mà chả thấy mẫu Capcut nào cho từ khóa "${keyword}" của mày cả. Chắc nó hot quá, chưa cập nhật kịp hoặc từ khóa lạ quá đó!`, tid, mid);
            return;
        }

        const limitedSearchData = searchData.slice(0, 7); // Lấy 7 kết quả đầu tiên thôi cho đỡ dài
        let attachments = [];
        let tempFilePaths = []; // Mảng để lưu đường dẫn file tạm cần xóa

        for (const result of limitedSearchData) {
            // Ưu tiên lấy thumbnail_url, nếu không có thì dùng video_url (có thể bị lỗi nếu nó là link video không stream được ảnh)
            const imageUrl = result.thumbnail_url || result.video_url; 
            if (imageUrl) {
                const imgObj = await streamURL(imageUrl, 'jpg'); // Mặc định là jpg cho thumbnail
                if (imgObj) {
                    attachments.push(imgObj.stream);
                    tempFilePaths.push(imgObj.path); // Lưu đường dẫn để xóa sau
                }
            }
        }

        const listMessage = limitedSearchData.map((result, index) => 
            `|› ${index + 1}. Tiêu đề: ${result.title}\n|› Tác giả: ${result.author.name}\n` + 
            `|› ID mẫu: ${result.template_id}\n` + // Thêm ID mẫu vào đây để tiện debug hoặc dùng sau này
            `──────────────────`
        ).join('\n');

        send({
            body: `[ Capcut Search - Mẫu Hot ]\n──────────────────\n${listMessage}\n\n📌 Reply (phản hồi) **STT** để tải video đó về! qh tự động xóa file sau khi gửi nha.`,
            attachment: attachments
        }, tid, (error, info) => {
            // Xóa các file thumbnail tạm sau khi gửi tin nhắn listing
            tempFilePaths.forEach(filePath => {
                fs.unlink(filePath).catch(e => console.error("Lỗi khi xóa file thumbnail Capcut:", e));
            });

            if (error) return console.error("Lỗi khi gửi danh sách Capcut:", error);

            global.client.handleReply.push({
                type: "search",
                name: exports.config.name,
                author: sid,
                messageID: info.messageID,
                result: limitedSearchData, // Chỉ sử dụng 7 kết quả đầu tiên
                tempFilePaths: [] // Khởi tạo mảng rỗng cho các file video tải về
            });
        });
    } catch (error) {
        console.error("Lỗi Capcut Search:", error);
        send("Ôi, tìm kiếm Capcut gặp vấn đề rồi! Có thể API đang dỗi hoặc mạng nhà qh lag. Thử lại sau nhé, Xám!", tid, mid);
    }
};

this.handleReply = async function ({ event, api, handleReply }) {
    const { threadID: tid, messageID: mid, body } = event;
    const send = (content, tid, mid) => api.sendMessage(content, tid, mid);

    if (handleReply.author !== event.senderID) { // Đảm bảo chỉ người dùng ra lệnh mới được reply
        return send("Đừng có xía vào cuộc nói chuyện của tôi với chủ thớt!", tid, mid);
    }

    switch (handleReply.type) {
        case 'search':
            const choose = parseInt(body);
            api.unsendMessage(handleReply.messageID); // Xóa tin nhắn handleReply

            if (isNaN(choose)) {
                return send('Nhập số đi chứ gõ linh tinh qh chịu thua.', tid, mid);
            }

            if (choose > handleReply.result.length || choose < 1) {
                return send('Lựa chọn của mày tạch rồi! Chỉ được chọn từ 1 đến ' + handleReply.result.length + ' thôi.', tid, mid);
            }

            try {
                const chosenVideo = handleReply.result[choose - 1];
                send(`Đang tải video mẫu "${chosenVideo.title}" từ Capcut về cho mày đây...`, tid, mid);

                // Tải video chính
                const videoObj = await streamURL(chosenVideo.video_url, 'mp4');
                if (!videoObj) {
                    return send("Có vẻ qh không tải được video này từ Capcut. Nó đỏng đảnh quá!", tid, mid);
                }

                // Thêm đường dẫn file video vào mảng để xóa sau
                handleReply.tempFilePaths.push(videoObj.path);

                send({
                    body: `[ Capcut Video Info ]\n──────────────────\n` +
                          `|› Tiêu đề: ${chosenVideo.title}\n` +
                          `|› Tác giả: ${chosenVideo.author.name} (ID: ${chosenVideo.author.unique_id})\n` +
                          `|› Thời lượng: ${formatTime(chosenVideo.duration * 1000)} giây\n` + // Nhân 1000 vì API trả về giây, hàm formatTime cần mili giây
                          `|› Số ảnh cần dùng: ${chosenVideo.fragment_count}\n` +
                          `|› Lượt dùng mẫu: ${chosenVideo.usage_amount}\n` +
                          `|› Lượt xem: ${chosenVideo.play_amount}\n` +
                          `|› Lượt thích: ${chosenVideo.like_count}\n` +
                          `|› Lượt comment: ${chosenVideo.comment_count}\n` +
                          `|› Lượt lưu: ${chosenVideo.favorite_count}\n` +
                          `|› Ngày tải lên: ${moment.unix(chosenVideo.create_time).tz('Asia/Ho_Chi_Minh').format('HH:mm:ss - DD/MM/YYYY')}\n` +
                          `|› Link mẫu: ${chosenVideo.share_url}\n` +
                          `──────────────────\n(File video sẽ tự động xóa sau khi gửi)`,
                    attachment: videoObj.stream
                }, tid, (err) => {
                    // Xóa tất cả các file tạm đã được lưu trong handleReply.tempFilePaths
                    handleReply.tempFilePaths.forEach(filePath => {
                        fs.unlink(filePath).catch(e => console.error("Lỗi khi xóa file video Capcut:", e));
                    });
                    // Xóa handleReply sau khi xử lý xong
                    const index = global.client.handleReply.findIndex(reply => reply.messageID === handleReply.messageID);
                    if (index !== -1) {
                        global.client.handleReply.splice(index, 1);
                    }
                    if (err) console.error("Lỗi khi gửi video Capcut:", err);
                });

            } catch (error) {
                console.error("Lỗi khi xử lý video Capcut:", error);
                send("Có biến rồi Xám! qh không tải được video mẫu Capcut này. Thử lại hoặc chọn mẫu khác nhé.", tid, mid);
                // Đảm bảo xóa handleReply ngay cả khi có lỗi
                const index = global.client.handleReply.findIndex(reply => reply.messageID === handleReply.messageID);
                if (index !== -1) {
                    global.client.handleReply.splice(index, 1);
                }
            }
            break;

        default:
            break;
    }
};

// Hàm định dạng thời gian
function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Hàm lấy dữ liệu từ API
async function getdata(keyword) {
    try {
        const res = await axios.get(`https://subhatde.id.vn/capcut/search?keyword=${encodeURIComponent(keyword)}`); // Encode keyword
        if (!res.data || res.data.length === 0) {
            console.log("Không tìm thấy kết quả nào từ API Capcut.");
            return [];
        }
        return res.data;
    } catch (error) {
        console.error("Lỗi khi fetch data từ API Capcut:", error.message);
        return [];
    }
}