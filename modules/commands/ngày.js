module.exports.config = {
    name: "ngày",
    version: "1.0.1", // Nâng version lên xíu ⬆️
    hasPermission: 0,
    credits: "Vtuan, modded by qh and Gemini ✨", // Giữ nguyên credits gốc và thêm tên chúng ta
    description: "đếm ngày đến tết âm lịch, tết dương lịch và ngày noel 🗓️", // Chữ thường, viết hoa đầu dòng + icon
    commandCategory: "tiện ích 🛠️", // Chữ thường, viết hoa đầu dòng + icon
    usages: "", // Không cần usages nếu chỉ dùng lệnh không có args
    cooldowns: 5
};

module.exports.run = async ({ event, api }) => { // Thêm async vì có thể cần await cho các hàm tương lai (vd: lấy Tết Âm)
    const { threadID, messageID } = event;

    // Hàm lấy ngày Tết Âm Lịch của năm hiện tại hoặc năm sau
    // (Cần một thư viện hoặc API bên ngoài để tính chính xác Tết Âm Lịch)
    // Tạm thời, Gemini sẽ dùng một API đơn giản cho ví dụ.
    // Nếu API này không ổn định, bạn cần tìm API khác hoặc tự tính toán.
    const getLunarNewYearDate = async (year) => {
        try {
            const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/vi.vietnamese%23holiday%40group.v.calendar.google.com/events?key=YOUR_API_KEY_HERE&timeMin=${year}-01-01T00%3A00%3A00Z&timeMax=${year}-03-01T00%3A00%3A00Z&q=Tết+Nguyên+Đán`);
            const events = response.data.items;
            if (events && events.length > 0) {
                // Tìm sự kiện Tết Nguyên Đán và lấy ngày bắt đầu
                const tetEvent = events.find(e => e.summary.includes('Tết Nguyên Đán'));
                if (tetEvent && tetEvent.start && tetEvent.start.date) {
                    return tetEvent.start.date;
                }
            }
            // Fallback nếu API không trả về hoặc không tìm thấy
            console.warn("Không thể lấy ngày Tết Âm Lịch từ API, sử dụng ngày cố định (có thể không chính xác).");
            // Đây chỉ là fallback, bạn nên thay thế YOUR_API_KEY_HERE bằng khóa API Google Calendar của bạn
            // Hoặc sử dụng một thư viện tính âm lịch nếu có.
            // Ví dụ: Tết 2025 là 29/01/2025 (Dương lịch)
            if (year === 2025) return '2025-01-29';
            if (year === 2026) return '2026-02-17'; 
            return null; // Trả về null nếu không tìm được
        } catch (error) {
            console.error("Lỗi khi gọi API lấy Tết Âm Lịch:", error);
            // Fallback nếu có lỗi API
            if (year === 2025) return '2025-01-29';
            if (year === 2026) return '2026-02-17';
            return null;
        }
    };
    
    // Cần import axios nếu dùng API
    const axios = require("axios"); // Thêm dòng này

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Đặt về đầu ngày để tính toán chính xác
    const formatDate = currentDate.toISOString().split('T')[0];

    const currentYear = currentDate.getFullYear();
    const nextYear = currentYear + 1;

    let lunarNewYearThisYear = await getLunarNewYearDate(currentYear);
    let lunarNewYearNextYear = await getLunarNewYearDate(nextYear);

    // Nếu Tết Âm năm nay đã qua, lấy Tết Âm năm sau
    if (lunarNewYearThisYear && new Date(lunarNewYearThisYear) < currentDate) {
        lunarNewYearThisYear = lunarNewYearNextYear; // Cập nhật để tính cho năm sau
    }

    const holidays = [
        {
            name: 'Tết Dương Lịch',
            date: `${currentYear}-01-01`,
            congrats: 'Chúc mừng năm mới! Hy vọng năm nay sẽ đầy may mắn và thành công. 🎉'
        },
        {
            name: 'Ngày Noel',
            date: `${currentYear}-12-25`,
            congrats: 'Merry Christmas! Chúc bạn một mùa Giáng Sinh ấm áp và tràn đầy hạnh phúc. 🎄'
        }
    ];

    // Thêm Tết Âm Lịch vào danh sách nếu có ngày hợp lệ
    if (lunarNewYearThisYear) {
        holidays.push({
            name: 'Tết Âm Lịch',
            date: lunarNewYearThisYear,
            congrats: 'Chúc mừng năm mới âm lịch! Vạn sự như ý, an khang thịnh vượng! 🧧'
        });
    }

    // Hàm tính ngày còn lại đến ngày lễ
    const calculateDaysLeft = (eventDateStr) => {
        const eventDate = new Date(eventDateStr);
        eventDate.setHours(0, 0, 0, 0); // Đặt về đầu ngày
        const diffTime = eventDate.getTime() - currentDate.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    let message = '';
    
    // Sắp xếp các ngày lễ theo thứ tự gần nhất (ngày còn lại ít nhất)
    // Lọc bỏ những ngày đã qua trong năm và chỉ hiển thị ngày của năm hiện tại
    const upcomingHolidays = holidays.filter(holiday => {
        const daysLeft = calculateDaysLeft(holiday.date);
        return daysLeft > 0 || formatDate === holiday.date; // Giữ lại ngày hiện tại hoặc ngày trong tương lai
    }).sort((a, b) => calculateDaysLeft(a.date) - calculateDaysLeft(b.date));


    if (upcomingHolidays.length === 0) {
        message = "Hiện tại không có ngày lễ lớn nào sắp tới trong danh sách. Hãy tận hưởng mỗi ngày nhé! 😊";
    } else {
        upcomingHolidays.forEach(holiday => {
            if (formatDate === holiday.date) {
                message += `${holiday.congrats}\n`;
            } else {
                const daysLeft = calculateDaysLeft(holiday.date);
                if (daysLeft > 0) { // Đảm bảo chỉ hiển thị những ngày chưa đến
                    message += `» Còn ${daysLeft} ngày nữa là đến ${holiday.name}. 🗓️\n`; // Thêm icon
                }
            }
        });
    }

    // Xử lý trường hợp đặc biệt "Ngày bth"
    const normalDay = {
        name: 'Ngày bình thường',
        date: `${currentYear}-12-21`, // Ngày này cố định cho ví dụ
        congrats: 'Đéo có cái cẹc gì đâu!! 😒'
    };
    if (formatDate === normalDay.date) {
        message += `\n${normalDay.congrats}\n`;
    }

    if (message) {
        // Viết hoa chữ cái đầu tiên của mỗi dòng trong tin nhắn
        const finalMessage = message.split('\n').map(line => {
            if (line.trim().length === 0 || line.startsWith('»')) return line; // Giữ nguyên dòng trống hoặc dòng có »
            return line.charAt(0).toUpperCase() + line.slice(1);
        }).join('\n');
        api.sendMessage(finalMessage.trim(), threadID, messageID);
    } else {
        api.sendMessage("Không có thông tin về các ngày lễ sắp tới. 🤷‍♀️", threadID, messageID); // Thông báo khi không có message
    }
};