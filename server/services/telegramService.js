const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');
const Briefing = require('../models/Briefing');

let bot;

const initTelegramBot = async () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not defined. Telegram bot will not start.');
    return;
  }

  // Jika sudah ada instance bot yang jalan, hentikan dulu pollingnya
  if (bot) {
    try {
      console.log('Stopping existing Telegram bot instance...');
      await bot.stopPolling();
    } catch (err) {
      console.warn('Error stopping existing Telegram bot:', err.message);
    }
  }

  try {
    // Start polling
    bot = new TelegramBot(token, { polling: true });
    console.log('Telegram bot is running.');

    // Handle polling errors gracefully
    bot.on('polling_error', (error) => {
      // Seringkali error ini karena koneksi atau multiple instance
      // Kita log tapi jangan biarkan crash
      console.error('Telegram Polling Error:', error.code, error.message);
      
      // Jika error 409 (Conflict), biasanya ada instance lain
      if (error.code === 'ETELEGRAM' && error.message.includes('409 Conflict')) {
        console.warn('Conflict: Another bot instance might be running with the same token.');
      }
    });

    bot.on('error', (error) => {
      console.error('Telegram General Error:', error);
    });

    // Cron Job: Setiap jam 09:00 pagi di hari Senin s.d. Jumat
    cron.schedule('0 9 * * 1-5', async () => {
      if (!chatId) {
        console.warn('TELEGRAM_CHAT_ID is not defined. Cannot send morning cron.');
        return;
      }

      try {
        // Ambil pekerjaan yang belum selesai
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

    // Listener untuk menangkap format: "tambahkan briefing hari ini : <pesan>" (Mendukung multi-line)
    bot.onText(/tambahkan briefing hari ini\s*:\s*([\s\S]+)/i, async (msg, match) => {
      const fromChatId = msg.chat.id;
      const textInput = match[1].trim();

      if (!textInput) return;

      const lines = textInput.split(/\r?\n/).filter(line => line.trim() !== '');
      const addedBriefings = [];
      const errors = [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const line of lines) {
        try {
          let lokasi = '';
          let pekerjaan = line.trim();

          if (pekerjaan.includes(' - ')) {
            const parts = pekerjaan.split(' - ');
            lokasi = parts[0].trim();
            pekerjaan = parts.slice(1).join(' - ').trim();
          }

          const newBriefing = new Briefing({
            tanggal: today,
            lokasi: lokasi,
            pekerjaan: pekerjaan,
            status: 'Pending',
            syncStatus: 'pending'
          });

          await newBriefing.save();
          addedBriefings.push({ lokasi, pekerjaan });
        } catch (error) {
          console.error('Error adding briefing via Telegram line:', line, error);
          errors.push(line);
        }
      }

      if (addedBriefings.length > 0) {
        let replyMsg = `✅ *${addedBriefings.length} Briefing berhasil ditambahkan*\n\n`;
        addedBriefings.forEach((b, index) => {
          replyMsg += `${index + 1}. *${b.lokasi || '-'}*: ${b.pekerjaan}\n`;
        });

        if (errors.length > 0) {
          replyMsg += `\n⚠️ *Gagal menambahkan:* ${errors.length} baris.`;
        }

        await bot.sendMessage(fromChatId, replyMsg, { parse_mode: 'Markdown' });
      } else if (errors.length > 0) {
        await bot.sendMessage(fromChatId, '❌ *Gagal menambahkan briefing.*\nTerjadi kesalahan di server.', { parse_mode: 'Markdown' });
      }
    });

  } catch (err) {
    console.error('Failed to initialize Telegram bot:', err);
  }
};

module.exports = { initTelegramBot };
