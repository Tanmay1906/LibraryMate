const cron = require('node-cron');
const { sendWhatsAppReminders } = require('../services/whatsappReminderService');

// Schedule to run every day at 10:00 AM
cron.schedule('0 10 * * *', async () => {
  console.log('Running daily WhatsApp reminder job at 10:00 AM');
  await sendWhatsAppReminders();
});
