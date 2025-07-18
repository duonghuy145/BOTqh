const { execSync } = require("child_process");

const username = "duonghuy145";
const email = "duonghuy1452011@gmail.com";
const repoUrl = `https://${process.env.GH_TOKEN}@github.com/duonghuy145/qh.git`; // 🛠 Đã đổi repo

try {
  console.log("🧠 Đang config Git...");
  execSync(`git config --global user.name "${username}"`);
  execSync(`git config --global user.email "${email}"`);

  console.log("📦 Commit & push code hiện tại...");
  execSync("git init");
  execSync("git remote remove origin || true");
  execSync(`git remote add origin ${repoUrl}`);
  execSync("git add .");
  execSync(`git commit -m "🔥 Push từ Replit by qh"`);
  execSync("git branch -M main");

  // Kéo về để tránh xung đột lịch sử
  execSync("git pull origin main --allow-unrelated-histories --rebase", { stdio: "inherit" });

  execSync("git push -u origin main", { stdio: "inherit" });

  console.log("✅ Đẩy lên GitHub thành công!");
} catch (err) {
  console.error("❌ Lỗi:", err.message);
}
