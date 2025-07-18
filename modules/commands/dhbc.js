const coinsup = 100000; //thay số coins được nhận khi đoán trúng
const coinsdown = 20000; //thay số coins bị mất khi yêu cầu gợi ý
const timeUnsend = 1; //thời gian thu hồi tin nhắn sau khi trả lời đúng trong thời gian timeUnsend
const axios = global.nodemodule["axios"];
const fs = global.nodemodule["fs-extra"]; // Cần lại fs-extra để tải và lưu ảnh

module.exports.config = {
    name: "dhbc",
    version: "1.5.0", // Tăng version
    hasPermssion: 0,
    credits: "D-Jukie (mod by qh và Gemini)", // Giữ nguyên credits
    description: "Đuổi hình bắt chữ trên chính messenger của bạn!!!",
    commandCategory: "Trò Chơi",
    usages: "[1/2]", // Khôi phục usages vì có lựa chọn
    cooldowns: 10
};

module.exports.handleReply = async function ({
    args,
    event,
    Users,
    api,
    handleReply,
    Currencies
}) {
    var { tukhoa, suggestions } = handleReply;

    switch (handleReply.type) {
        case "choosee": {
            const choose = parseInt(event.body);
            if (isNaN(event.body)) {
                api.unsendMessage(handleReply.messageID); // Thu hồi nếu nhập không hợp lệ
                return api.sendMessage(" ➜ Vui lòng nhập 1 con số", event.threadID, event.messageID);
            }
            if (choose > 2 || choose < 1) {
                api.unsendMessage(handleReply.messageID); // Thu hồi nếu lựa chọn không hợp lệ
                return api.sendMessage("➜ Lựa chọn không nằm trong danh sách.", event.threadID, event.messageID);
            }

            let dataGame, tukhoadung, sokitu, anh1, anh2, imglove = [];

            // Xóa handleReply khỏi danh sách ngay sau khi xử lý lựa chọn
            global.client.handleReply = global.client.handleReply.filter(
                reply => reply.messageID !== handleReply.messageID
            );

            if (choose === 2) {
                const res = await axios.get(`https://raw.githubusercontent.com/J-JRT/api1/mainV2/data.json`);
                const length1 = res.data.doanhinh.length;
                dataGame = res.data.doanhinh[Math.floor(Math.random() * length1)];
                tukhoadung = dataGame.tukhoa;
                suggestions = dataGame.suggestions;
                sokitu = dataGame.sokitu;
                anh1 = dataGame.link1;
                anh2 = dataGame.link2;

                let Avatar = (await axios.get(anh1, { responseType: "arraybuffer" })).data;
                fs.writeFileSync(__dirname + "/cache/ảnh/anh1.png", Buffer.from(Avatar, "utf-8"));
                let Avatar2 = (await axios.get(anh2, { responseType: "arraybuffer" })).data;
                fs.writeFileSync(__dirname + "/cache/ảnh/anh2.png", Buffer.from(Avatar2, "utf-8"));

                imglove.push(fs.createReadStream(__dirname + "/cache/ảnh/anh1.png"));
                imglove.push(fs.createReadStream(__dirname + "/cache/ảnh/anh2.png"));

            } else if (choose === 1) {
                const res = await axios.get(`https://raw.githubusercontent.com/J-JRT/api1/mainV2/data2.json`);
                const length2 = res.data.doanhinh.length;
                dataGame = res.data.doanhinh[Math.floor(Math.random() * length2)];
                tukhoadung = dataGame.tukhoa;
                suggestions = dataGame.suggestions;
                sokitu = dataGame.sokitu;
                anh1 = dataGame.link;

                let Avatar = (await axios.get(anh1, { responseType: "arraybuffer" })).data;
                fs.writeFileSync(__dirname + "/cache/ảnh/anh1.png", Buffer.from(Avatar, "utf-8"));

                imglove.push(fs.createReadStream(__dirname + "/cache/ảnh/anh1.png"));
            }

            // Gửi tin nhắn câu đố và sau đó thu hồi tin nhắn hỏi chọn chế độ
            var msg = {
                body: `[⚜️]→ Vui lòng reply tin nhắn này để trả lời:\nGợi ý: ${sokitu}\n\n[⚜️]→ Reply: Gợi ý - để xem gợi ý 2 (-${coinsdown}$)`,
                attachment: imglove
            };

            return api.sendMessage(msg, event.threadID, (error, info) => {
                if (!error) {
                    api.unsendMessage(handleReply.messageID); // Thu hồi tin nhắn hỏi chọn chế độ
                    global.client.handleReply.push({
                        type: "reply", // Loại reply chung để xử lý câu trả lời
                        name: this.config.name,
                        author: event.senderID,
                        messageID: info.messageID,
                        tukhoa: tukhoadung,
                        suggestions: suggestions
                    });
                } else {
                    console.error("Lỗi khi gửi câu đố:", error);
                    api.sendMessage("Có lỗi xảy ra khi tạo câu đố. Vui lòng thử lại sau!", event.threadID, event.messageID);
                }
            });
        }

        case "reply": {
            const dapan = event.body;
            if (dapan.toLowerCase() == "gợi ý") {
                let balance = (await Currencies.getData(event.senderID)).money;
                if (coinsdown > balance) return api.sendMessage(`➜ Số dư không đủ ${coinsdown}$ để xem gợi ý!!`, event.threadID, event.messageID);
                await Currencies.decreaseMoney(event.senderID, parseInt(coinsdown));
                api.sendMessage(`➜ Gợi ý cho bạn là: \n➜ ${suggestions} (-${coinsdown}$)`, event.threadID, event.messageID);
            } else {
                if (dapan.toLowerCase() == tukhoa) {
                    await Currencies.increaseMoney(event.senderID, parseInt(coinsup));
                    var name1 = await Users.getData(event.senderID);
                    setTimeout(function () {
                        api.unsendMessage(handleReply.messageID);
                    }, timeUnsend * 1000);
                    return api.sendMessage(`➜ ${name1.name} đã trả lời chính xác!\n ➜ Đáp án: ${tukhoa} (+${coinsup}$)`, event.threadID, event.messageID);
                } else {
                    return api.sendMessage(` ➜ Sai rồi nha :v`, event.threadID, event.messageID);
                }
            }
        }; break;
        default: break;
    }
};

module.exports.run = async function ({
    args,
    api,
    event,
    Users
}) {
    if ((this.config.credits) != "D-Jukie (mod by qh và Gemini)") { return api.sendMessage(`⚡️Phát hiện credits đã bị thay đổi`, event.threadID, event.messageID)}

    // Nếu có args[0] (tức là người dùng gõ /dhbc 1 hoặc /dhbc 2) thì xử lý luôn
    if (args[0] && (args[0] === '1' || args[0] === '2')) {
        const choose = parseInt(args[0]);
        let dataGame, tukhoadung, sokitu, anh1, anh2, imglove = [];

        if (choose === 2) {
            const res = await axios.get(`https://raw.githubusercontent.com/J-JRT/api1/mainV2/data.json`);
            const length1 = res.data.doanhinh.length;
            dataGame = res.data.doanhinh[Math.floor(Math.random() * length1)];
            tukhoadung = dataGame.tukhoa;
            suggestions = dataGame.suggestions;
            sokitu = dataGame.sokitu;
            anh1 = dataGame.link1;
            anh2 = dataGame.link2;

            let Avatar = (await axios.get(anh1, { responseType: "arraybuffer" })).data;
            fs.writeFileSync(__dirname + "/cache/ảnh/anh1.png", Buffer.from(Avatar, "utf-8"));
            let Avatar2 = (await axios.get(anh2, { responseType: "arraybuffer" })).data;
            fs.writeFileSync(__dirname + "/cache/ảnh/anh2.png", Buffer.from(Avatar2, "utf-8"));

            imglove.push(fs.createReadStream(__dirname + "/cache/ảnh/anh1.png"));
            imglove.push(fs.createReadStream(__dirname + "/cache/ảnh/anh2.png"));

        } else if (choose === 1) {
            const res = await axios.get(`https://raw.githubusercontent.com/J-JRT/api1/mainV2/data2.json`);
            const length2 = res.data.doanhinh.length;
            dataGame = res.data.doanhinh[Math.floor(Math.random() * length2)];
            tukhoadung = dataGame.tukhoa;
            suggestions = dataGame.suggestions;
            sokitu = dataGame.sokitu;
            anh1 = dataGame.link;

            let Avatar = (await axios.get(anh1, { responseType: "arraybuffer" })).data;
            fs.writeFileSync(__dirname + "/cache/ảnh/anh1.png", Buffer.from(Avatar, "utf-8"));

            imglove.push(fs.createReadStream(__dirname + "/cache/ảnh/anh1.png"));
        }

        var msg = {
            body: `[⚜️]→ Vui lòng reply tin nhắn này để trả lời:\nGợi ý: ${sokitu}\n\n[⚜️]→ Reply: Gợi ý - để xem gợi ý 2 (-${coinsdown}$)`,
            attachment: imglove
        };

        return api.sendMessage(msg, event.threadID, (error, info) => {
            global.client.handleReply.push({
                type: "reply",
                name: this.config.name,
                author: event.senderID,
                messageID: info.messageID,
                tukhoa: tukhoadung,
                suggestions: suggestions
            });
        });
    }

    // Nếu không có args[0], tức là chỉ gõ /dhbc, thì hỏi chọn chế độ
    return api.sendMessage(`⚡️Vui lòng thêm chế độ chơi:\n\n1: Một ảnh\n2: Hai ảnh\n\n⚡️Vui lòng reply tin nhắn này để chọn chế độ`, event.threadID, (error, info) => {
        global.client.handleReply.push({
            type: "choosee", // Vẫn giữ type này để chờ reply lựa chọn
            name: this.config.name,
            author: event.senderID,
            messageID: info.messageID
        });
    });
};