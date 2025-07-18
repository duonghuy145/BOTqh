const request = require('request');
const fs = require("fs-extra"); // Sử dụng fs-extra để dễ thao tác với file
const path = require("path"); // Thêm module path để quản lý đường dẫn

module.exports.config = {
    name: "6mui",
    version: "4.1.1", // Nâng version để đánh dấu sửa lỗi quan trọng
    hasPermission: 0,
    credits: "Vtuan (Đã điều chỉnh bởi qh và Gemini) 👑", // Cập nhật credit
    description: "📸 Gửi ngẫu nhiên một hình ảnh 6 múi.",
    commandCategory: "Ảnh",
    usages: "", // Không cần usages vì lệnh không có tham số
    cooldowns: 10 // Giảm cooldown cho hợp lý hơn
};

module.exports.run = async ({ api, event }) => {
    const { threadID, messageID } = event;

    try {
        // Đảm bảo đường dẫn tới file JSON là chính xác
        // Đây là đường dẫn đến file mui.json trong thư mục includes/datajson
        const muiDataPath = path.join(__dirname, '..', '..', 'includes', 'datajson', 'mui.json');

        // Kiểm tra xem file có tồn tại không
        if (!fs.existsSync(muiDataPath)) {
            return api.sendMessage("⚠️ Không tìm thấy file dữ liệu hình ảnh 6 múi (mui.json). Vui lòng kiểm tra lại đường dẫn hoặc đảm bảo file tồn tại.", threadID, messageID);
        }

        // Đọc dữ liệu từ file mui.json
        const muiData = fs.readJsonSync(muiDataPath);

        // Kiểm tra dữ liệu có hợp lệ không
        if (!Array.isArray(muiData) || muiData.length === 0) {
            return api.sendMessage("⚠️ Dữ liệu hình ảnh 6 múi trong file mui.json không hợp lệ hoặc trống rỗng. Vui lòng kiểm tra định dạng file.", threadID, messageID);
        }

        // Chọn ngẫu nhiên một URL ảnh từ muiData
        const imageUrl = muiData[Math.floor(Math.random() * muiData.length)].trim();

        if (!imageUrl || !imageUrl.startsWith('http')) { // Kiểm tra xem có phải là URL hợp lệ không
            return api.sendMessage("⚠️ URL hình ảnh không hợp lệ. Vui lòng kiểm tra lại dữ liệu trong file mui.json.", threadID, messageID);
        }

        const imageFileName = `6mui_${Date.now()}.png`; // Tên file độc đáo
        const imagePath = path.join(__dirname, 'cache', imageFileName); // Lưu vào thư mục cache

        // Đảm bảo thư mục cache tồn tại
        await fs.ensureDir(path.dirname(imagePath));

        // Tải và lưu ảnh
        request(imageUrl).pipe(fs.createWriteStream(imagePath))
            .on("close", () => {
                // Gửi ảnh
                api.sendMessage({
                    attachment: fs.createReadStream(imagePath)
                }, threadID, (error) => {
                    // Xóa file ảnh tạm sau khi gửi
                    fs.unlink(imagePath, (err) => {
                        if (err) console.error("❌ Lỗi khi xóa file ảnh tạm:", err);
                    });
                    if (error) {
                        console.error("❌ Lỗi khi gửi ảnh 6 múi:", error);
                        return api.sendMessage("❌ Đã xảy ra lỗi khi gửi hình ảnh. Vui lòng thử lại sau.", threadID, messageID);
                    }
                }, messageID);
            })
            .on("error", (err) => {
                console.error("❌ Lỗi khi tải ảnh 6 múi:", err);
                api.sendMessage("❌ Không thể tải hình ảnh từ nguồn. Vui lòng thử lại sau. Có thể link ảnh bị hỏng.", threadID, messageID);
                // Đảm bảo xóa file tạm nếu có lỗi trong quá trình tải
                fs.unlink(imagePath, (unlinkErr) => {
                    if (unlinkErr) console.error("❌ Lỗi khi xóa file ảnh tạm sau lỗi tải:", unlinkErr);
                });
            });

    } catch (error) {
        console.error("❌ Lỗi trong quá trình thực thi lệnh 6mui:", error);
        api.sendMessage(`Đã xảy ra lỗi khi xử lý yêu cầu. Chi tiết: ${error.message}`, threadID, messageID);
    }
};