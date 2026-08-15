const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const nodemailer = require('nodemailer');

initializeApp();

const gmailUser = defineSecret('GMAIL_USER');
const gmailAppPassword = defineSecret('GMAIL_APP_PASSWORD');

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function enquiryDetailsHtml(enquiry) {
  return `
    <p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(enquiry.email)}</p>
    <p><strong>WhatsApp:</strong> ${escapeHtml(enquiry.whatsapp)}</p>
    <p><strong>Trip:</strong> ${escapeHtml(enquiry.trip) || '—'}</p>
    <p><strong>Travellers:</strong> ${enquiry.travellers ?? '—'}</p>
    <p><strong>Dates:</strong> ${escapeHtml(enquiry.dates) || '—'}</p>
    <p><strong>Message:</strong><br>${escapeHtml(enquiry.message).replace(/\n/g, '<br>')}</p>
  `;
}

exports.onEnquiryCreated = onDocumentCreated(
  { document: 'enquiries/{enquiryId}', secrets: [gmailUser, gmailAppPassword] },
  async (event) => {
    const enquiry = event.data?.data();
    if (!enquiry) return;

    const fromAddress = gmailUser.value();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: fromAddress, pass: gmailAppPassword.value() }
    });

    const sends = [
      transporter.sendMail({
        from: `"The Host with the Utmost" <${fromAddress}>`,
        to: fromAddress,
        replyTo: enquiry.email || undefined,
        subject: `New enquiry from ${enquiry.name || 'a website visitor'}`,
        html: enquiryDetailsHtml(enquiry)
      })
    ];

    if (enquiry.email) {
      sends.push(transporter.sendMail({
        from: `"The Host with the Utmost" <${fromAddress}>`,
        to: enquiry.email,
        subject: "We've received your enquiry — The Host with the Utmost",
        html: `
          <p>Hi ${escapeHtml(enquiry.name) || 'there'},</p>
          <p>Thanks for reaching out to The Host with the Utmost! We've received your enquiry and will be in touch soon.</p>
          <p><strong>Here's what you sent us:</strong></p>
          ${enquiryDetailsHtml(enquiry)}
          <p>Talk soon,<br>The Host with the Utmost team</p>
        `
      }));
    }

    await Promise.all(sends);
  }
);
