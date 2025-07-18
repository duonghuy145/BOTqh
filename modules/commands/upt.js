const os = require('os');
const moment = require('moment-timezone');
const fs = require('fs').promises;
const osu = require('os-utils');

module.exports.config = {
  name: "upt",
  version: "2.0.0",
  hasPermission: 3,
  credits: "VAZTEAM",
  description: "Hiển thị thông tin hệ thống của bot",
  commandCategory: "Admin",
  usages: "upt",
  cooldowns: 5
};

async function getDependencyCount() {
  try {
    const packageJsonString = await fs.readFile('package.json', 'utf8');
    const packageJson = JSON.parse(packageJsonString);
    const depCount = Object.keys(packageJson.dependencies || {}).length;
    const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
    return { depCount, devDepCount };
  } catch (error) {
    console.error('Không thể đọc file package.json:', error);
    return { depCount: -1, devDepCount: -1 };
  }
}

function getStatusByPing(ping) {
  if (ping < 200) {
    return 'tốt';
  } else if (ping < 800) {
    return 'bình thường';
  } else {
    return 'xấu';
  }
}

async function getBotFileSize() {
  try {
    const stats = await fs.stat(__filename);
    const fileSizeInBytes = stats.size;
    const fileSizeInKB = fileSizeInBytes / 1024;
    const fileSizeInMB = fileSizeInKB / 1024;
    return { fileSizeInBytes, fileSizeInKB, fileSizeInMB };
  } catch (error) {
    console.error('Không thể đọc thông tin file bot:', error);
    return { fileSizeInBytes: -1, fileSizeInKB: -1, fileSizeInMB: -1 };
  }
}
async function getCurrentCPUUsage() {
  return new Promise((resolve) => {
    osu.cpuUsage((v) => {
      resolve((v * 100).toFixed(2)); // Chuyển đổi thành phần trăm và làm tròn đến 2 chữ số sau dấu thập phân
    });
  });
}

// Function to generate a simple progress bar based on percentage
function createProgressBar(percentage) {
  const numFilled = Math.floor(percentage / 10);
  const numEmpty = 10 - numFilled;
  return '█'.repeat(numFilled) + '░'.repeat(numEmpty);
}


module.exports.run = async ({ api, event, Users, Threads }) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const uptime = process.uptime();

  const { depCount, devDepCount } = await getDependencyCount();
  let name = await Users.getNameUser(event.senderID);
  const botPing = Date.now() - event.timestamp; // Tính toán ping
  const botStatus = getStatusByPing(botPing);

  const uptimeHours = Math.floor(uptime / (60 * 60));
  const uptimeMinutes = Math.floor((uptime % (60 * 60)) / 60);
  const uptimeSeconds = Math.floor(uptime % 60);

  const formattedUptime = `${uptimeHours < 10 ? '0' + uptimeHours : uptimeHours}:${uptimeMinutes < 10 ? '0' + uptimeMinutes : uptimeMinutes}:${uptimeSeconds < 10 ? '0' + uptimeSeconds : uptimeSeconds}`;

  const threadInfo = await Threads.getInfo(event.threadID);
  const memberCount = threadInfo.participantIDs.length;

  const cpuUsage = await getCurrentCPUUsage();
  const ramUsagePercentage = ((usedMemory / totalMemory) * 100).toFixed(1);

  // Formatted message including CPU and RAM details
  const replyMsg = `
👾 Uptime Infomation 👾
⏰ Thời gian hiện tại: ${moment().tz('Asia/Ho_Chi_Minh').format('HH:mm:ss')}
⌛ Bot đã hoạt động: ${formattedUptime}
🌐 Ping: ${botPing}ms

💻 Hệ điều hành: ${os.type()}
⚙️ Cấu trúc: ${os.arch()}
💽 CPU: ${os.cpus()[0].model.trim()}
• THÔNG TIN •
CPU đang sử dụng: ${cpuUsage}%
${createProgressBar(parseFloat(cpuUsage))}
RAM đang sử dụng: ${ramUsagePercentage}%
${createProgressBar(parseFloat(ramUsagePercentage))}
Ram gốc: ${(totalMemory / (1024 * 1024 * 1024)).toFixed(2)}GB
Ram sử dụng: ${(usedMemory / (1024 * 1024 * 1024)).toFixed(2)}GB
Ram còn lại: ${(freeMemory / (1024 * 1024 * 1024)).toFixed(2)}GB
👤 Người dùng: ${name}
  `.trim();

  api.sendMessage(replyMsg, event.threadID, event.messageID);
};
