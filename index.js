const { spawn } = require("child_process");
const express = require("express");
const path = require("path");
const logger = require("./utils/log"); // Nếu file log.js có export logger()
const cron = require('node-cron'); // ⏰ Thêm gói node-cron để lên lịch tác vụ

const app = express();
const PORT = process.env.PORT || 2025;

// ⚙️ Route chính để kiểm tra uptime
app.get("/", (req, res) => {
  res.send("✅ Bot của qh đang sống mạnh mẽ trên Replit / Railway 😎");
});

// 🚀 Khởi động server express
app.listen(PORT, () => {
  console.log(`[ SECURITY ] -> Máy chủ khởi động tại port: ${PORT}`);
});

// ⏰ Lên lịch cron job để giữ bot tỉnh táo 24/24
// Sẽ chạy mỗi 14 phút một lần để ping chính nó, ngăn Replit tắt
cron.schedule('*/14 * * * *', async () => {
  console.log('✨ Đang tự động ping để giữ bot của qh thức dậy... 😴 -> 💡');
  try {
    // Sử dụng fetch để gọi lại chính URL của project trên Replit/Railway
    // process.env.REPL_URL sẽ tự động lấy URL của Replit/Railway
    const response = await fetch(process.env.REPL_URL || `http://localhost:${PORT}`);
    if (response.ok) {
      console.log('✅ Đã ping thành công! Bot vẫn đang online. 🥳');
    } else {
      console.error(`❌ Lỗi khi ping: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('🚨 Lỗi kết nối khi tự ping:', error.message);
  }
});

// 🔁 Hàm khởi động lại bot nếu bị crash
function startBot(message) {
  if (message) logger(message, "BOT STARTING");

  const child = spawn(
    "node",
    ["--trace-warnings", "--async-stack-traces", "main.js"],
    {
      cwd: __dirname,
      stdio: "inherit",
      shell: true,
    }
  );

  // Bot crash → khởi động lại hoặc delay tùy code
  child.on("close", async (codeExit) => {
    const code = String(codeExit);
    if (code === "1") {
      startBot("⚠️ Bot bị crash! Đang khởi động lại...");
    } else if (code.startsWith("2")) {
      const delay = parseInt(code.slice(1)) * 1000;
      console.log(`⏳ Delay ${delay / 1000}s trước khi restart bot...`);
      await new Promise((r) => setTimeout(r, delay));
      startBot("⏳ Đang khởi động lại bot sau delay...");
    } else {
      console.log(`❌ Bot exited with code ${codeExit}, không tự restart.`);
    }
  });

  // Bắt lỗi khi chạy
  child.on("error", (err) => {
    logger(`Lỗi khi chạy bot: ${JSON.stringify(err)}`, "BOT ERROR");
  });
}

// ⛳️ Khởi động lần đầu
startBot();
