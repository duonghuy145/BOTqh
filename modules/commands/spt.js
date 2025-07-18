const fs = require("fs");
const axios = require("axios");
const yts = require("yt-search");
const ytdl = require("ytdl-core");
// <-- ⛔ Gây lỗi nếu chưa cài module

const path = require("path");

const dataPath = path.join(__dirname, "spt_data");
const historyPath = path.join(dataPath, "history.json");
const playlistPath = path.join(dataPath, "playlist.json");
const tempPath = path.join(dataPath, "temp");

module.exports = {
  config: {
    name: "spt",
    aliases: ["spot", "play", "youtube"],
    version: "12.1",
    author: "VIP Mod",
    countDown: 3,
    role: 0,
    shortDescription: "Tìm và phát nhạc từ YouTube",
    longDescription: "Tìm kiếm bài hát theo tên và phát nhạc trực tiếp từ YouTube",
    category: "media",
    guide: "{pn} <tên bài hát>"
  },

  onStart: async function ({ api, event, args }) {
    const keyword = args.join(" ");
    if (!keyword)
      return api.sendMessage("❌ Vui lòng nhập từ khoá bài hát cần tìm.", event.threadID, event.messageID);

    try {
      const { videos } = await yts(keyword);
      if (!videos.length)
        return api.sendMessage("❌ Không tìm thấy bài hát nào.", event.threadID, event.messageID);

      const results = videos.slice(0, 6);
      const msg = results.map((video, i) =>
        `${i + 1}. ${video.title}\n⏱️ ${video.timestamp} | 👁️ ${video.views.toLocaleString()}\n📎 ${video.author.name}\n`
      ).join("\n");

      const choices = results.map(video => ({
        title: video.title,
        url: video.url,
        id: video.videoId,
        duration: video.timestamp
      }));

      const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
      history[event.senderID] = choices;
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

      api.sendMessage(`🎵 Kết quả tìm kiếm cho: ${keyword}\n\n${msg}\n➡️ Trả lời số để chọn bài hát.`, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          messageID: info.messageID
        });
      }, event.messageID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("❌ Đã xảy ra lỗi khi tìm kiếm bài hát.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { senderID, threadID, messageID, body } = event;
    if (Reply.author != senderID) return;

    const index = parseInt(body);
    if (isNaN(index) || index < 1 || index > 6)
      return api.sendMessage("⚠️ Vui lòng chọn số từ 1 đến 6.", threadID, messageID);

    const history = JSON.parse(fs.readFileSync(historyPath, "utf-8"));
    const video = history[senderID][index - 1];
    if (!video) return api.sendMessage("❌ Không tìm thấy bài hát đã chọn.", threadID, messageID);

    try {
      const filePath = path.join(tempPath, `${video.id}.mp3`);
      const stream = await ytdl(video.url, { filter: "audioonly" });
      const writeStream = fs.createWriteStream(filePath);
      stream.pipe(writeStream);

      writeStream.on("finish", () => {
        api.sendMessage({
          body: `🎶 Phát: ${video.title}\n⏱️ Thời lượng: ${video.duration}`,
          attachment: fs.createReadStream(filePath)
        }, threadID, () => {
          fs.unlinkSync(filePath);
        }, messageID);

        // Ghi vào playlist
        const playlist = JSON.parse(fs.readFileSync(playlistPath, "utf-8"));
        playlist.push({
          user: senderID,
          title: video.title,
          id: video.id,
          time: new Date().toISOString()
        });
        fs.writeFileSync(playlistPath, JSON.stringify(playlist, null, 2));
      });
    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ Lỗi khi tải nhạc. Có thể video quá dài hoặc bị giới hạn.", threadID, messageID);
    }
  }
};
