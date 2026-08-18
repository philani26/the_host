const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { defineSecret } = require('firebase-functions/params');
const { initializeApp } = require('firebase-admin/app');
const nodemailer = require('nodemailer');

initializeApp();

const smtpHost = defineSecret('SMTP_HOST');
const smtpPort = defineSecret('SMTP_PORT');
const smtpUser = defineSecret('SMTP_USER');
const smtpPass = defineSecret('SMTP_PASS');

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
  { document: 'enquiries/{enquiryId}', secrets: [smtpHost, smtpPort, smtpUser, smtpPass] },
  async (event) => {
    const enquiryId = event.params.enquiryId;
    const enquiry = event.data?.data();
    if (!enquiry) { console.warn(`onEnquiryCreated: no data for ${enquiryId}`); return; }

    const fromAddress = smtpUser.value();
    const port = Number(smtpPort.value());
    console.log(`onEnquiryCreated: sending for ${enquiryId} via ${smtpHost.value()}:${port} as ${fromAddress}`);

    const transporter = nodemailer.createTransport({
      host: smtpHost.value(),
      port,
      secure: port === 465,
      auth: { user: fromAddress, pass: smtpPass.value() }
    });

    const jobs = [
      { label: 'admin notification', mail: {
        from: `"The Host with the Utmost" <${fromAddress}>`,
        to: fromAddress,
        replyTo: enquiry.email || undefined,
        subject: `New enquiry from ${enquiry.name || 'a website visitor'}`,
        html: enquiryDetailsHtml(enquiry)
      } }
    ];

    if (enquiry.email) {
      jobs.push({ label: 'visitor confirmation', mail: {
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
      } });
    }

    const results = await Promise.allSettled(jobs.map(j => transporter.sendMail(j.mail)));
    results.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        console.log(`onEnquiryCreated: ${jobs[i].label} sent for ${enquiryId}, messageId=${result.value.messageId}`);
      } else {
        console.error(`onEnquiryCreated: ${jobs[i].label} FAILED for ${enquiryId}:`, result.reason);
      }
    });
  }
);
