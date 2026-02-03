# Firebase Cloud Functions for OTP Email Verification

This guide provides the necessary Firebase Cloud Functions code to implement OTP (One-Time Password) email verification. You will need to deploy these functions to your Firebase project for the OTP client-side logic to work.

## Prerequisites

1.  **Firebase CLI:** Ensure you have the Firebase CLI installed (`npm install -g firebase-tools`).
2.  **Firebase Project Initialized:** Your project must be initialized for Cloud Functions. If not, run `firebase init functions` in your project's root directory.
3.  **Blaze Plan:** Cloud Functions require the Firebase Blaze (pay-as-you-go) plan for outbound networking (sending emails).
4.  **Mailgun/SendGrid/Nodemailer:** You'll need an email service for sending OTPs. This example uses Nodemailer with a Gmail account for simplicity, but for production, consider services like SendGrid or Mailgun.
5.  **Environment Variables:** You'll need to configure environment variables for your email service credentials.

---

## 1. Cloud Functions Setup

Navigate to your `functions` directory (usually created by `firebase init functions`). You'll find an `index.js` (or `index.ts`) file. Add the following code to it.

**`index.js` (or `index.ts` - ensure you install types if using TypeScript)**

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer'); // For sending emails
const otpGenerator = require('otp-generator'); // For generating OTPs

admin.initializeApp();
const db = admin.firestore();

// Configure Nodemailer with environment variables
// Make sure to set these using:
// firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
// Use an App Password for Gmail (not your regular password) if 2FA is enabled.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

/**
 * Sends an OTP to the provided email address.
 * Stores the OTP and its expiration in Firestore.
 */
exports.sendOtp = functions.https.onCall(async (data, context) => {
  const email = data.email;

  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email is required.');
  }

  // Generate a 6-digit OTP
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes

  try {
    // Save OTP to Firestore
    await db.collection('otps').doc(email).set({
      otp: otp,
      expiresAt: expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send email
    const mailOptions = {
      from: functions.config().gmail.email,
      to: email,
      subject: 'Your Verification Code',
      html: `
        <p>안녕하세요,</p>
        <p>요청하신 인증번호는 <strong>${otp}</strong> 입니다.</p>
        <p>이 인증번호는 5분 후에 만료됩니다.</p>
        <p>감사합니다.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: 'OTP sent successfully!' };
  } catch (error) {
    console.error('Error sending OTP:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send OTP.', error.message);
  }
});

/**
 * Verifies the provided OTP against the stored OTP in Firestore.
 * If valid, it also marks the user's email as verified in Firebase Auth.
 */
exports.verifyOtp = functions.https.onCall(async (data, context) => {
  const email = data.email;
  const otp = data.otp;

  if (!email || !otp) {
    throw new new functions.https.HttpsError('invalid-argument', 'Email and OTP are required.');
  }

  try {
    const otpDoc = await db.collection('otps').doc(email).get();

    if (!otpDoc.exists) {
      return { success: false, message: '인증번호를 찾을 수 없습니다.' };
    }

    const storedOtpData = otpDoc.data();
    if (storedOtpData.otp !== otp) {
      return { success: false, message: '인증번호가 일치하지 않습니다.' };
    }

    if (storedOtpData.expiresAt.toDate() < new Date()) {
      await otpDoc.ref.delete(); // Delete expired OTP
      return { success: false, message: '인증번호가 만료되었습니다.' };
    }

    // OTP is valid and not expired
    await otpDoc.ref.delete(); // Consume the OTP

    // Optionally: Mark user's email as verified in Firebase Auth
    // This requires the user to be created first or linked to an Auth user.
    // For registration flow, we assume the user is created right after this verification.
    // So, we will not mark the emailVerified here. The client-side will proceed to create the user.

    return { success: true, message: 'OTP verified successfully!' };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw new functions.https.HttpsError('internal', 'Failed to verify OTP.', error.message);
  }
});

```

---

## 2. Install Dependencies

In your `functions` directory, install the required `npm` packages:

```bash
npm install firebase-functions firebase-admin nodemailer otp-generator
```

## 3. Configure Environment Variables

Set your Gmail credentials (or your chosen email service's credentials) for Nodemailer:

```bash
firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-password"
```

Replace `"your-email@gmail.com"` with your actual Gmail address and `"your-app-password"` with an App Password generated from your Google Account security settings (if you use 2-Step Verification). **Do NOT use your regular Gmail password.**

## 4. Deploy Functions

Finally, deploy your Cloud Functions:

```bash
firebase deploy --only functions
```

---

**Important Notes:**

*   **Security:** For production, use a dedicated email service (SendGrid, Mailgun) instead of Gmail, and ensure your App Password is kept secure.
*   **Firestore Security Rules:** You'll need a Firestore security rule to allow clients (your `auth.js`) to call these functions. (This is handled by Firebase Callable Functions automatically).
*   **Email Verified Flag:** In your `auth.js`, after successful OTP verification, we mark `emailVerified: true` when adding the user to Firestore. This assumes that OTP verification is sufficient for considering the email verified.
*   **Rate Limiting:** For a production system, consider adding rate limiting to your `sendOtp` function to prevent abuse.
