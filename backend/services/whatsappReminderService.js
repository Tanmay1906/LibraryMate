const axios = require('axios');
const { getStudentsWithPendingFees } = require('../models/studentModel');

const AISENSY_API_URL = 'https://backend.aisensy.com/api/sendCampaign';
const AISENSY_API_KEY = process.env.AISENSY_API_KEY; // Set this in your .env file

async function sendWhatsAppReminders() {
  try {
    const students = await getStudentsWithPendingFees();
    if (!students.length) {
      console.log('No students with pending fees.');
      return;
    }
    for (const student of students) {
      const body = {
        campaignName: 'Fee Reminder',
        destination: student.phone_number,
        userName: student.name,
        templateParams: [student.due_date]
      };
      try {
        const response = await axios.post(AISENSY_API_URL, body, {
          headers: {
            Authorization: `Bearer ${AISENSY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.data && response.data.status === 'success') {
          console.log(`WhatsApp reminder sent to ${student.name} (${student.phone_number})`);
        } else {
          console.error(`Failed to send reminder to ${student.name}:`, response.data);
        }
      } catch (err) {
        console.error(`Error sending WhatsApp reminder to ${student.name}:`, err.response ? err.response.data : err.message);
      }
    }
  } catch (error) {
    console.error('Error in sendWhatsAppReminders:', error);
  }
}

module.exports = { sendWhatsAppReminders };
