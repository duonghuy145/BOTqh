const fs = require('fs'),
  ytdl = require('ytdl-core'), 
  fse = require("fs-extra"),
  moment = require("moment-timezone"),
  Youtube = require('youtube-search-api'),
  path = require('path');

module.exports.config = {
  name: "sing",
  version: "1.0.8",
  hasPermission: 0,
  credits: "D-Jukie fix TKDEV",
  description: "Nghe nhạc của Youtube ngay trên Messenger", 
  commandCategory: "Tiện ích",
  usages: "[tên bài hát]",
  cooldowns: 3,
  usePrefix: true
};

module.exports.run = async function({ api, event, args }) {
  if (!args[0])
    return api.sendMessage("❎ Vui lòng nhập tên bài hát!", event.threadID, event.messageID);
  try {
    const data = (await Youtube.GetListByKeyword(args.join(" "), false, 6)).items.filter(i => i.type === "video");
    if (!data.length)
      return api.sendMessage("❎ Không tìm thấy bài nào phù hợp!", event.threadID, event.messageID);
    const msg = data.map((v, i) =>
      `|› ${i + 1}. ${v.title}\n|› 👤 ${v.channelTitle}\n|› ⏱️ ${v.length.simpleText}\n──────────────────`
    ).join('\n');
    const link = data.map(v => v.id);
    return api.sendMessage(
      `📝 Kết quả:\n${msg}\n\n📌 Reply STT để bot gửi nhạc cho bạn!`,
      event.threadID,
      (err, info) => {
        if (err) console.error("Lỗi gửi message ban đầu:", err);
        global.client.handleReply.push({
          type: 'reply',
          name: module.exports.config.name,
          author: event.senderID,
          messageID: info.messageID,
          link
        });
      },
      event.messageID
    );
  } catch (e) {
    console.error("Lỗi tìm kiếm:", e);
    return api.sendMessage("❎ Lỗi khi tìm kiếm bài hát!", event.threadID, event.messageID);
  }
};

module.exports.handleReply = async function({ api, event, handleReply }) {
  const { threadID, messageID, body, senderID } = event;
  console.log("Handle reply triggered:", { threadID, messageID, body, senderID });
  const id = handleReply.link[parseInt(body) - 1];
  if (!id) {
    console.log("ID không hợp lệ:", body);
    return api.sendMessage("❎ Số bạn chọn không hợp lệ!", threadID, messageID);
  }

  const dirPath = path.join(__dirname, '../../yaneka/data/datacmds/youtube');
  const filePath = path.join(dirPath, `sing-${senderID}.mp3`);
  console.log("Đường dẫn file:", filePath);

  try {
    // Ensure the full directory path exists
    await fse.ensureDir(dirPath).catch(err => {
      console.error("Lỗi tạo thư mục:", err);
      throw new Error("Không thể tạo thư mục để lưu file!");
    });
    console.log("Thư mục đã được tạo hoặc đã tồn tại:", dirPath);

    ytdl.cache.update = () => {}; // Fix lỗi cache decipher
    console.log("Bắt đầu tải info video:", id);
    const info = await ytdl.getInfo(`https://www.youtube.com/watch?v=${id}`);
    const v = info.videoDetails;
    console.log("Info video tải thành công:", v.title);

    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    const format = audioFormats.find(f =>
      f.mimeType?.includes('audio/mp4') && f.audioBitrate <= 128
    ) || audioFormats.find(f => f.mimeType?.includes('audio/mp4')) || audioFormats[0];
    if (!format?.url) {
      console.error("Không tìm thấy định dạng audio phù hợp:", audioFormats);
      return api.sendMessage("❎ Không thể tìm thấy định dạng nào phù hợp!", threadID, messageID);
    }
    console.log("Định dạng audio chọn:", format.quality);

    const stream = ytdl.downloadFromInfo(info, {
      format,
      highWaterMark: 1 << 26 // 64MB buffer
    }).pipe(fs.createWriteStream(filePath, { highWaterMark: 1 << 26 }));
    console.log("Bắt đầu stream file:", filePath);

    stream.on('finish', () => {
      console.log("Stream hoàn tất, kiểm tra file:", filePath);
      try {
        if (!fs.existsSync(filePath)) {
          throw new Error("File không tồn tại sau khi tải");
        }
        const size = fs.statSync(filePath).size;
        console.log("Kích thước file:", size);
        if (size > 26214400 || size === 0) {
          throw new Error("File không hợp lệ hoặc quá lớn");
        }
        api.unsendMessage(handleReply.messageID);
        console.log("Gửi message với attachment:", filePath);
        api.sendMessage({
          body: `=== [ YouTube Music ] ===
──────────────────
🎵 Tên bài hát: ${v.title}
⏱️ Thời lượng: ${convertHMS(v.lengthSeconds)} |
👤 Tác giả: ${v.author.name}
📆 Ngày đăng: ${v.uploadDate}
👁️ Lượt xem: ${v.viewCount}
──────────────────
⏰ ${moment.tz("Asia/Ho_Chi_Minh").format("HH:mm:ss | DD/MM/YYYY")} ⏱️`,
          attachment: fs.createReadStream(filePath, { highWaterMark: 1 << 26 })
        }, threadID, (err) => {
          if (err) {
            console.error("Lỗi gửi file:", err);
            api.sendMessage("❎ Lỗi khi gửi file âm thanh!", threadID, messageID);
          }
          fse.unlinkSync(filePath);
          console.log("File đã được xóa sau khi gửi:", filePath);
        }, messageID);
      } catch (e) {
        console.error("Lỗi kiểm tra file:", e);
        api.sendMessage("❎ File không hợp lệ hoặc quá lớn không thể gửi!", threadID, () => fse.unlinkSync(filePath), messageID);
      }
    });

    stream.on('error', e => {
      console.error("Lỗi stream:", e);
      api.sendMessage("❎ Lỗi khi tải bài hát!", threadID, messageID);
      if (fs.existsSync(filePath)) fse.unlinkSync(filePath);
    });

  } catch (e) {
    console.error("Lỗi xử lý bài hát:", e);
    api.sendMessage(`❎ Đã xảy ra lỗi khi tải bài hát: ${e.message}`, threadID, messageID);
    if (fs.existsSync(filePath)) fse.unlinkSync(filePath);
  }
};

function convertHMS(s) {
  const h = Math.floor(s / 3600),
        m = Math.floor((s % 3600) / 60),
        sec = s % 60;
  return [h, m, sec].map(v => v < 10 ? "0" + v : v)
    .filter((v, i) => v !== "00" || i > 0)
    .join(":");
}