const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const AISENSY_API_URL = 'https://backend.aisensy.com/api/sendCampaign';
const AISENSY_API_KEY = process.env.AISENSY_API_KEY; // Set this in your .env file

// Get students with pending payments
async function getStudentsWithPendingFees() {
  try {
    const students = await prisma.student.findMany({
      where: {
        paymentStatus: 'pending'
      },
      include: {
        library: true
      }
    });
    return students;
  } catch (error) {
    console.error('Error fetching students with pending fees:', error);
    return [];
  }
}

async function sendWhatsAppReminders() {
  try {
    const students = await getStudentsWithPendingFees();
    
    if (!students.length) {
      console.log('No students with pending fees.');
      return;
    }

    console.log(`Found ${students.length} students with pending payments`);

    for (const student of students) {
      const body = {
        campaignName: 'Fee Reminder',
        destination: student.phone,
        userName: student.name,
        templateParams: [student.dueDate]
      };

      try {
        if (!AISENSY_API_KEY) {
          console.log(`Would send WhatsApp reminder to ${student.name} (${student.phone}) - API key not configured`);
          continue;
        }

        const response = await axios.post(AISENSY_API_URL, body, {
          headers: {
            Authorization: `Bearer ${AISENSY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data && response.data.status === 'success') {
          console.log(`WhatsApp reminder sent to ${student.name} (${student.phone})`);
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

module.exports = { sendWhatsAppReminders, getStudentsWithPendingFees };
