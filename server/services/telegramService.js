const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const Briefing = require('../models/Briefing');

let bot;

const initTelegramBot = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not defined. Telegram bot will not start.');
    return;
  }

  // Start polling
  bot = new TelegramBot(token, { polling: true });
  console.log('Telegram bot is running.');

  // Cron Job: Setiap jam 09:00 pagi di hari Senin s.d. Jumat
  cron.schedule('0 9 * * 1-5', async () => {
    if (!chatId) {
      console.warn('TELEGRAM_CHAT_ID is not defined. Cannot send morning cron.');
      return;
    }

    try {
      // Ambil pekerjaan yang belum selesai
      // (Berdasarkan status yang bukan 'Done' dan bukan 'Selesai')
      const unfinishedBriefings = await Briefing.find({
        status: { $nin: ['Done', 'Selesai'] }
      }).sort({ tanggal: -1 });

      if (unfinishedBriefings.length === 0) {
        await bot.sendMessage(chatId, '🎉 *Tidak ada pekerjaan briefing yang belum selesai!*', { parse_mode: 'Markdown' });
        return;
      }

      let message = '🔔 *Reminder Pekerjaan Belum Selesai*\n\n';
      unfinishedBriefings.forEach((b, index) => {
        const dateStr = b.tanggal ? b.tanggal.toLocaleDateString('id-ID') : '-';
        message += `${index + 1}. [${dateStr}] ${b.pekerjaan || 'Tanpa deskripsi'}\n`;
        message += `   Lokasi: ${b.lokasi || '-'}\n`;
        message += `   Status: ${b.status}\n\n`;
      });

      await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error in Telegram Cron Job:', error);
    }
  });

  // Listener untuk menangkap format: "tambahkan briefing hari ini : <pesan>"
  bot.onText(/tambahkan briefing hari ini\s*:\s*(.+)/i, async (msg, match) => {
    const fromChatId = msg.chat.id;
    const textInput = match[1];

    try {
      let lokasi = '';
      let pekerjaan = textInput;

      // Logika sederhana: jika ada pemisah " - ", indeks 0 adalah lokasi, sisanya pekerjaan
      if (textInput.includes(' - ')) {
        const parts = textInput.split(' - ');
        lokasi = parts[0].trim();
        pekerjaan = parts.slice(1).join(' - ').trim();
      }

      const today = new Date();
      // Reset jam supaya sesuai standar tanggal database
      today.setHours(0, 0, 0, 0);

      const newBriefing = new Briefing({
        tanggal: today,
        lokasi: lokasi,
        pekerjaan: pekerjaan,
        status: 'Pending',
        syncStatus: 'pending' // Flag agar tersinkron ke sheets jika menggunakan fitur sync
      });

      await newBriefing.save();

      const replyMsg = `✅ *Briefing berhasil ditambahkan*\n\nLokasi: ${lokasi || '-'}\nPekerjaan: ${pekerjaan}`;
      await bot.sendMessage(fromChatId, replyMsg, { parse_mode: 'Markdown' });
    } catch (error) {
      console.error('Error adding briefing via Telegram:', error);
      await bot.sendMessage(fromChatId, '❌ *Gagal menambahkan briefing.*\nTerjadi kesalahan di server.', { parse_mode: 'Markdown' });
    }
  });
};

module.exports = { initTelegramBot };
