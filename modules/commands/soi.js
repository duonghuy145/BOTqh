const axios = require("axios");
const fs = require("fs");
const path = require("path");
const Youtube = require("youtube-search-api");
const ytdl = require("@distube/ytdl-core");
const { createReadStream, unlinkSync, existsSync, mkdirSync } = require("fs-extra");

const CONFIG = {
  BOT_NAME: "Wolfsamson",
  CACHE_DIR: path.resolve(__dirname, "cache"),
  GOOGLE_VISION_API_KEY: "AIzaSyAVomZ45nrPrW3fDNak-sg32CkW_MN2MwU",
  MAX_HISTORY: 10,
  COOLDOWN: 3000,
  DEBUG: true
};

const STATE = {
  isProcessing: {},
  messageHistory: {},
  songOptions: {},
  lastCommandTime: {},
};

function isOnCooldown(threadID) {
  const now = Date.now();
  if (STATE.lastCommandTime[threadID] && now - STATE.lastCommandTime[threadID] < CONFIG.COOLDOWN) {
    return true;
  }
  STATE.lastCommandTime[threadID] = now;
  return false;
}

function convertHMS(seconds) {
  const sec = parseInt(seconds, 10);
  let hours = Math.floor(sec / 3600);
  let minutes = Math.floor((sec - hours * 3600) / 60);
  let secs = sec - hours * 3600 - minutes * 60;

  if (hours < 10) hours = "0" + hours;
  if (minutes < 10) minutes = "0" + minutes;
  if (secs < 10) secs = "0" + secs;

  return (hours !== "00" ? hours + ":" : "") + minutes + ":" + secs;
}

async function downloadYoutubeAudio(link, filePath) {
  return new Promise((resolve, reject) => {
    ytdl(link, {
      filter: format => format.quality === 'tiny' && format.hasAudio === true,
    })
      .pipe(fs.createWriteStream(filePath))
      .on("close", async () => {
        try {
          const data = await ytdl.getInfo(link);
          resolve({
            title: data.videoDetails.title,
            dur: Number(data.videoDetails.lengthSeconds),
            author: data.videoDetails.author.name,
            viewCount: data.videoDetails.viewCount,
            success: true
          });
        } catch {
          resolve({ success: false });
        }
      })
      .on("error", err => reject(err));
  });
}

async function handleMusicCommand(keyword, threadID) {
  const results = (await Youtube.GetListByKeyword(keyword, false, 5)).items;
  if (!results.length) return { text: "Không tìm được bài nào!" };

  let msg = "🎵 Tao tìm thấy mấy bài:\n\n";
  const videoLinks = [];

  results.forEach((item, i) => {
    msg += `${i + 1}. ${item.title} | ${item.length.simpleText}\n`;
    videoLinks.push(item.id);
  });

  msg += "\nReply số để tao gửi bài!";
  STATE.songOptions[threadID] = videoLinks;

  return { text: msg };
}

module.exports.config = {
  name: "soi",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "ChatGPT sửa lại cho Node14",
  description: "Sói gầm gừ không AI",
  commandCategory: "Tiện ích",
  usages: "[nhạc/bài hát] | [math]",
  cooldowns: 3,
};

module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, senderID, body, messageReply } = event;
  if (!body) return;
  const lowerBody = body.toLowerCase();

  if (isOnCooldown(threadID)) return;

  // Tìm nhạc
  if (lowerBody.includes("nhạc") || lowerBody.includes("bài hát")) {
    const keyword = body.replace(/(sói|wolf|wolfsamson)/gi, "").trim();
    const res = await handleMusicCommand(keyword, threadID);
    api.sendMessage(res.text, threadID, messageID);
    return;
  }

  // Chọn nhạc
  if (STATE.songOptions[threadID] && !isNaN(parseInt(body))) {
    const index = parseInt(body) - 1;
    const id = STATE.songOptions[threadID][index];
    const link = `https://www.youtube.com/watch?v=${id}`;
    const filePath = `${CONFIG.CACHE_DIR}/soi-${threadID}.mp3`;

    if (existsSync(filePath)) unlinkSync(filePath);

    api.sendMessage("Đợi tao tải về đã...", threadID, messageID);
    const song = await downloadYoutubeAudio(link, filePath);

    if (!song.success) {
      api.sendMessage("Tải nhạc lỗi, chọn bài khác đi!", threadID, messageID);
      return;
    }

    const msg = {
      body: `🎵 ${song.title}\n👤 ${song.author}\n⏱ ${convertHMS(song.dur)}\n👁 ${song.viewCount} lượt xem`,
      attachment: createReadStream(filePath)
    };
    api.sendMessage(msg, threadID);
    return;
  }

  // Trả lời basic
  if (lowerBody.includes("1+1") || lowerBody.includes("mấy giờ")) {
    api.sendMessage("Sao mày hỏi ngu vậy, 1+1 là 2!", threadID, messageID);
  } else if (lowerBody.includes("sói")) {
    api.sendMessage("Tao là sói, mày gọi gì tao đấy?", threadID, messageID);
  }
};

module.exports.run = function () { };
