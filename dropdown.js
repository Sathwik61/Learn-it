const msg = document.getElementById("msg");
const cls = document.getElementById("cls");
const bot = document.getElementById("bot");
const pdf = document.getElementById("pdf");

msg.addEventListener("click", () => {
  window.location.assign("chat-room/message.html");
});

cls.addEventListener("click", () => {
  window.location.assign("vedio-call/vediocall.html");
});

bot.addEventListener("click", () => {
  window.location.assign("chat-bot/chatbot.html");
});

pdf.addEventListener("click", () => {
  window.location.assign("/pdfextractor/pdfextract.html");
});
