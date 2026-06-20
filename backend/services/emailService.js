const nodemailer = require('nodemailer');

// Initialize transporter
let transporter;
let transporterReady = false;

const setupTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Use real SMTP if provided in .env
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    transporterReady = true;
  } else {
    // Attempt Ethereal fallback for local testing only
    try {
      console.log('No SMTP credentials found. Attempting Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      transporterReady = true;
    } catch (err) {
      console.warn('⚠️  Could not create Ethereal test account. Email sending will be simulated.', err.message);
      transporterReady = false;
    }
  }
};

// Immediately invoke setup (non-blocking)
setupTransporter().catch(err => {
  console.warn('Email transporter setup failed:', err.message);
  transporterReady = false;
});

exports.sendVerificationEmail = async (email, otp) => {
  // Always log the OTP for debugging/backup verification
  console.log('\n======================================================');
  console.log(`✉️  VERIFICATION REQUEST FOR: ${email}`);
  console.log(`🔑 OTP CODE: ${otp}`);
  console.log('======================================================\n');

  // If transporter is not ready, skip email but don't throw
  if (!transporterReady || !transporter) {
    console.warn(`⚠️  Email transporter not available. OTP for ${email}: ${otp}`);
    return { simulated: true, otp };
  }

  try {
    const mailOptions = {
      from: '"Elite97 Registry" <noreply@elite97.com>',
      to: email,
      subject: 'Elite97 - Verify Your Account',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #02050A; color: #fff; padding: 40px; text-align: center;">
          <h1 style="color: #00F0FF; letter-spacing: 2px;">ELITE<span style="color: #fff;">97</span></h1>
          <h3 style="color: #94A3B8; text-transform: uppercase;">Verification Required</h3>
          <p style="font-size: 16px; color: #E2E8F0; max-width: 500px; margin: 0 auto 30px;">
            Welcome to Elite97. Please verify your email address to activate your node credentials.
          </p>
          <div style="background-color: #040A14; border: 1px solid rgba(0, 240, 255, 0.3); padding: 20px; border-radius: 10px; display: inline-block;">
            <h2 style="margin: 0; font-size: 32px; letter-spacing: 5px; color: #00F0FF;">${otp}</h2>
          </div>
          <p style="color: #64748B; font-size: 12px; margin-top: 30px;">
            This code will expire in 15 minutes. If you did not request this, please ignore this email.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    // If using ethereal, log the URL to view the email
    if (info.messageId && transporter.options.host === 'smtp.ethereal.email') {
      console.log(`🔗 PREVIEW URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (err) {
    console.error(`❌ Failed to send email to ${email}:`, err.message);
    console.warn(`⚠️  Registration will proceed. OTP for ${email}: ${otp}`);
    // Don't throw - let registration continue even if email fails
    return { error: err.message, simulated: true, otp };
  }
};
