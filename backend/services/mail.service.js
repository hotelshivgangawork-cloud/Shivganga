import SibApiV3Sdk from "sib-api-v3-sdk";
import { config } from "../configs/env.js";
import SystemSetting from "../models/SystemSetting.model.js";

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications["api-key"].apiKey = config.BREVO_API_KEY;

const transactionalEmailApi = new SibApiV3Sdk.TransactionalEmailsApi();

/* ================= RESET PASSWORD ================= */
export const sendResetPasswordMail = async (toEmail, resetToken) => {
  const resetLink = `${config.CLIENT_URL}/login?resetToken=${resetToken}`;

  await transactionalEmailApi.sendTransacEmail({
    sender: {
      email: config.BREVO_SENDER_EMAIL,
      name: "Hotel Admin",
    },
    to: [{ email: toEmail }],
    subject: "Reset your password",
    htmlContent: `
      <p>Password reset requested</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>This link will expire in 15 minutes</p>
    `,
  });
};

/* ================= RECEPTIONIST CREDENTIALS ================= */
export const sendReceptionistCredentialsMail = async ({
  fullName,
  email,
  password,
  employeeId,
}) => {
  await transactionalEmailApi.sendTransacEmail({
    sender: {
      name: "ShivGanga Hotel",
      email: config.BREVO_SENDER_EMAIL,
    },
    to: [{ email }],
    subject: "Your Receptionist Account Credentials",
    htmlContent: `
      <p>Hello <b>${fullName}</b>,</p>
      <p>You have been added as a <b>Receptionist</b> at ShivGanga Hotel.</p>
      <p><b>Login Details:</b></p>
      <ul>
        <li>Email: ${email}</li>
        <li>Employee ID: ${employeeId}</li>
        <li>Temporary Password: ${password}</li>
      </ul>
      <p>Please change your password after first login.</p>
      
      <p>Regards,<br/>ShivGanga Hotel</p>
    `,
  });
};

/* ================= BOOKING CONFIRMATION ================= */
export const sendBookingConfirmationMail = async ({
  name,
  email,
  guestId,
  bookingReference,
  checkInDate,
  checkOutDate,
  nights,
  rooms = [],
  activities = [],
  pricing = {},
}) => {
  const system = await SystemSetting.findOne().sort({ updatedAt: -1 });
  if (!system) throw new Error("System settings not configured");

  const formatINR = (n) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const {
    roomTotal = 0,
    activityTotal = 0,
    extraGuestTotal = 0,
    membershipDiscount = 0,
    coupon = null,
    grandTotal = 0,
    paidAmount = 0,
    pendingAmount = 0,
    paymentType = "FULL",
  } = pricing;

  /* ================= ROOMS HTML ================= */

  const roomsHTML =
    rooms.length > 0
      ? `
    <h4 style="margin-bottom:10px;">Rooms</h4>
    ${rooms
      .map(
        (r) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>${r.name} (${r.plan?.toUpperCase()}) × ${r.quantity}</span>
          <span>₹${formatINR(r.totalPrice)}</span>
        </div>
      `
      )
      .join("")}
    `
      : "";

  /* ================= ACTIVITIES HTML ================= */

  const activitiesHTML =
    activities.length > 0
      ? `
    <h4 style="margin-top:15px;margin-bottom:10px;">Activities</h4>
    ${activities
      .map(
        (a) => `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>${a.name} × ${a.quantity}</span>
          <span>₹${formatINR(a.totalPrice)}</span>
        </div>
      `
      )
      .join("")}
    `
      : "";

  /* ================= PAYMENT BREAKDOWN ================= */

  let discountHTML = "";

  if (membershipDiscount > 0) {
    discountHTML += `
      <div style="display:flex;justify-content:space-between;color:green;">
        <span>Membership Discount</span>
        <span>- ₹${formatINR(membershipDiscount)}</span>
      </div>
    `;
  }

  if (coupon && coupon.discountAmount > 0) {
    discountHTML += `
      <div style="display:flex;justify-content:space-between;color:green;">
        <span>Coupon (${coupon.code})</span>
        <span>- ₹${formatINR(coupon.discountAmount)}</span>
      </div>
    `;
  }

  /* ================= EMAIL TEMPLATE ================= */

  // const htmlContent = `
  // <div style="font-family:Arial,sans-serif;background:#f6f6f6;padding:20px;">
  //   <div style="max-width:700px;margin:auto;background:#ffffff;padding:30px;border-radius:10px;">

  //     <div style="text-align:center;margin-bottom:20px;">
  //       ${
  //         system.logo
  //           ? `<img src="${system.logo}" style="max-height:80px;margin-bottom:10px;" />`
  //           : ""
  //       }
  //       <h2>${system.systemHotelName}</h2>
  //       <p style="color:#666;">Booking Confirmation</p>
  //     </div>

  //     <p>Hello <b>${name}</b>,</p>
  //     <p>Your booking has been successfully confirmed.</p>

  //     <hr/>

  //     <h3>Booking Details</h3>
  //     <div style="display:flex;justify-content:space-between;">
  //       <span>Reference</span>
  //       <span><b>${bookingReference}</b></span>
  //     </div>
  //     <div style="display:flex;justify-content:space-between;">
  //       <span>Guest ID</span>
  //       <span>${guestId}</span>
  //     </div>
  //     <div style="display:flex;justify-content:space-between;">
  //       <span>Check-in</span>
  //       <span>${checkInDate}</span>
  //     </div>
  //     <div style="display:flex;justify-content:space-between;">
  //       <span>Check-out</span>
  //       <span>${checkOutDate}</span>
  //     </div>
  //     <div style="display:flex;justify-content:space-between;margin-bottom:15px;">
  //       <span>Nights</span>
  //       <span>${nights}</span>
  //     </div>

  //     <hr/>

  //     ${roomsHTML}
  //     ${activitiesHTML}

  //     <hr/>

  //     <h3>Payment Summary</h3>

  //     <div style="display:flex;justify-content:space-between;">
  //       <span>Room & Add-ons</span>
  //       <span>₹${formatINR(roomTotal + activityTotal + extraGuestTotal)}</span>
  //     </div>

  //     ${discountHTML}

  //     <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;margin-top:10px;">
  //       <span>Final Amount</span>
  //       <span>₹${formatINR(grandTotal)}</span>
  //     </div>

  //     <div style="margin-top:15px;padding:10px;background:#f1f8ff;border-radius:6px;">
  //       <div style="display:flex;justify-content:space-between;">
  //         <span>Payment Type</span>
  //         <span>${paymentType === "PARTIAL" ? "Partial Payment" : "Full Payment"}</span>
  //       </div>
  //       <div style="display:flex;justify-content:space-between;">
  //         <span>Paid</span>
  //         <span>₹${formatINR(paidAmount)}</span>
  //       </div>
  //       ${
  //         pendingAmount > 0
  //           ? `
  //         <div style="display:flex;justify-content:space-between;">
  //           <span>Remaining</span>
  //           <span>₹${formatINR(pendingAmount)}</span>
  //         </div>
  //       `
  //           : ""
  //       }
  //     </div>

  //     <hr/>

  //     <p>If you need assistance, contact us:</p>
  //     <p><b>Phone:</b> ${system.systemPhoneNumbers?.[0] || "N/A"}</p>
  //     <p><b>Email:</b> ${system.systemEmails?.[0] || ""}</p>

  //     <p style="margin-top:20px;">Regards,<br/><b>${system.systemHotelName}</b></p>
  //     <p style="font-size:12px;color:#777;text-align:center;">
  //       This is an automated email. Please do not reply.
  //     </p>

  //   </div>
  // </div>
  // `;

const htmlContent = `
<div style="font-family:Arial,sans-serif;background:#f6f6f6;padding:20px;">
  <div style="max-width:700px;margin:auto;background:#ffffff;padding:30px;border-radius:10px;">

    <div style="text-align:center;margin-bottom:20px;">
      ${
        system.logo
          ? `<img src="${system.logo}" style="max-height:80px;margin-bottom:10px;" />`
          : ""
      }
      <h2>${system.systemHotelName}</h2>
      <p style="color:#666;">Booking Confirmation</p>
    </div>

    <p>Hello <b>${name}</b>,</p>
    <p>Your booking has been successfully confirmed. Below are your booking and payment details.</p>

    <hr/>

    <h3>Booking Details</h3>
    <div style="display:flex;justify-content:space-between;"><span>Reference</span><b>${bookingReference}</b></div>
    <div style="display:flex;justify-content:space-between;"><span>Guest ID</span><span>${guestId}</span></div>
    <div style="display:flex;justify-content:space-between;"><span>Check-in</span><span>${checkInDate}</span></div>
    <div style="display:flex;justify-content:space-between;"><span>Check-out</span><span>${checkOutDate}</span></div>
    <div style="display:flex;justify-content:space-between;margin-bottom:15px;"><span>Nights</span><span>${nights}</span></div>

    <hr/>

    ${rooms.length > 0 ? `
      <h3>Room Charges</h3>
      ${rooms.map(r => `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>${r.name} (${r.plan?.toUpperCase()}) × ${r.quantity}</span>
          <span>₹${formatINR(r.totalPrice)}</span>
        </div>
      `).join("")}
      <div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:8px;">
        <span>Total Room Price</span>
        <span>₹${formatINR(roomTotal)}</span>
      </div>
      <hr/>
    ` : ""}

    ${activities.length > 0 ? `
      <h3>Activities Charges</h3>
      ${activities.map(a => `
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span>${a.name} × ${a.quantity}</span>
          <span>₹${formatINR(a.totalPrice)}</span>
        </div>
      `).join("")}
      <div style="display:flex;justify-content:space-between;font-weight:bold;margin-top:8px;">
        <span>Total Activities Price</span>
        <span>₹${formatINR(activityTotal)}</span>
      </div>
      <hr/>
    ` : ""}

    ${extraGuestTotal > 0 ? `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span>Extra Guest Charges</span>
        <span>₹${formatINR(extraGuestTotal)}</span>
      </div>
      <hr/>
    ` : ""}

    <h3>Discounts</h3>
    ${membershipDiscount > 0 ? `
      <div style="display:flex;justify-content:space-between;color:green;">
        <span>Membership Discount</span>
        <span>- ₹${formatINR(membershipDiscount)}</span>
      </div>
    ` : ""}

    ${coupon?.discountAmount > 0 ? `
      <div style="display:flex;justify-content:space-between;color:green;">
        <span>Coupon (${coupon.code})</span>
        <span>- ₹${formatINR(coupon.discountAmount)}</span>
      </div>
    ` : ""}

    <hr/>

    <h3>Final Payment Summary</h3>
    <div style="display:flex;justify-content:space-between;font-size:18px;font-weight:bold;">
      <span>Grand Total</span>
      <span>₹${formatINR(grandTotal)}</span>
    </div>

    <div style="margin-top:15px;padding:12px;background:#f1f8ff;border-radius:6px;">
      <div style="display:flex;justify-content:space-between;">
        <span>Payment Type</span>
        <span>${paymentType === "PARTIAL" ? "Partial Payment" : "Full Payment"}</span>
      </div>
      <div style="display:flex;justify-content:space-between;">
        <span>Paid Amount</span>
        <span>₹${formatINR(paidAmount)}</span>
      </div>
      ${pendingAmount > 0 ? `
        <div style="display:flex;justify-content:space-between;">
          <span>Pending Amount</span>
          <span>₹${formatINR(pendingAmount)}</span>
        </div>
      ` : ""}
    </div>

    <hr/>

    <p><b>Need Help?</b></p>
    <p><b>Phone:</b> ${system.systemPhoneNumbers?.[0] || "N/A"}</p>
    <p><b>Email:</b> ${system.systemEmails?.[0] || "N/A"}</p>

    <p style="margin-top:20px;">Regards,<br/><b>${system.systemHotelName}</b></p>

    <p style="font-size:12px;color:#777;text-align:center;">
      This is an automated email. Please do not reply.
    </p>

  </div>
</div>
`;


  await transactionalEmailApi.sendTransacEmail({
    sender: {
      email: config.BREVO_SENDER_EMAIL,
      name: system.systemHotelName,
    },
    to: [{ email }],
    subject: `Booking Confirmed - ${bookingReference}`,
    htmlContent,
  });
};

/* ================= CONTACT MAIL ================= */
export const sendContactMailToAdmin = async ({
  name,
  email,
  subject,
  message,
}) => {
  await transactionalEmailApi.sendTransacEmail({
    sender: {
      email: config.BREVO_SENDER_EMAIL,
      name: "ShivGanga Website",
    },
    to: [{ email: config.BREVO_SENDER_EMAIL }],
    subject: `New Contact Message: ${subject}`,
    htmlContent: `
      <h3>New Contact Query</h3>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Subject:</b> ${subject}</p>
      <p><b>Message:</b></p>
      <p>${message}</p>
    `,
  });
};

/* ================= EMAIL OTP ================= */
export const sendEmailOTP = async ({ email, otp }) => {
  await transactionalEmailApi.sendTransacEmail({
    sender: {
      email: config.BREVO_SENDER_EMAIL,
      name: config.BREVO_SENDER_NAME,
    },
    to: [{ email }],
    subject: "Your Booking OTP",
    htmlContent: `
      <h2>Verify your email</h2>
      <p>Your OTP is:</p>
      <h1>${otp}</h1>
      <p>This OTP is valid for 10 minutes.</p>
    `,
  });
};

/* ================= SUBSCRIPTION CONFIRMATION ================= */
export const sendSubscriptionConfirmationMail = async (toEmail) => {
  const system = await SystemSetting.findOne().sort({ updatedAt: -1 });
  const hotelName = system?.systemHotelName || "Shiv Ganga Hotel";
  const contactEmail =
    Array.isArray(system?.systemEmails) && system.systemEmails.length > 0
      ? system.systemEmails[0]
      : config.BREVO_SENDER_EMAIL;

  await transactionalEmailApi.sendTransacEmail({
    sender: {
      name: hotelName,
      email: config.BREVO_SENDER_EMAIL,
    },
    to: [{ email: toEmail }],
    subject: `You're subscribed to ${hotelName} • Exclusive updates inside`,
    htmlContent: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f6f6f6;padding:24px;">
        <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
          <div style="padding:24px 24px 0 24px;text-align:center;">
            ${system?.logo ? `<img src="${system.logo}" alt="${hotelName}" style="max-height:64px;margin-bottom:12px;" />` : ""}
            <h2 style="margin:8px 0 4px;color:#0f172a;">${hotelName}</h2>
            <p style="margin:0;color:#64748b;font-size:14px;">Subscription Confirmed</p>
          </div>

          <div style="padding:24px;">
            <p style="color:#0f172a;font-size:15px;line-height:1.6;margin:0 0 12px 0;">
              Hello,
            </p>
            <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 12px 0;">
              Thank you for subscribing to ${hotelName}. You’ll start receiving exclusive promotions,
              seasonal offers, and news about upcoming experiences straight to your inbox.
            </p>
            <p style="color:#334155;font-size:14px;line-height:1.7;margin:0 0 12px 0;">
              We value your privacy and send only curated updates. You can unsubscribe at any time by replying to this email.
            </p>

            
          </div>

          <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #eef2f7;color:#64748b;font-size:12px;text-align:center;">
            <div>${hotelName}</div>
            ${system?.systemAddress ? `<div style="margin-top:4px;">${system.systemAddress}</div>` : ""}
          </div>
        </div>
      </div>
    `,
  });
};

export const sendAdminNewSubscriberMail = async ({ email }) => {
  const system = await SystemSetting.findOne().sort({ updatedAt: -1 });
  const hotelName = system?.systemHotelName || "Shiv Ganga Hotel";
  const adminEmail =
    Array.isArray(system?.systemEmails) && system.systemEmails.length > 0
      ? system.systemEmails[0]
      : config.BREVO_SENDER_EMAIL;

  await transactionalEmailApi.sendTransacEmail({
    sender: {
      name: hotelName,
      email: config.BREVO_SENDER_EMAIL,
    },
    to: [{ email: adminEmail }],
    subject: `New newsletter subscription: ${email}`,
    htmlContent: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f8fafc;padding:24px;">
        <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.06);overflow:hidden;">
          <div style="padding:20px 24px;border-bottom:1px solid #eef2f7;">
            <h3 style="margin:0;color:#0f172a;">New Newsletter Subscriber</h3>
            <p style="margin:6px 0 0;color:#64748b;font-size:14px;">${hotelName}</p>
          </div>

          <div style="padding:20px 24px;">
            <p style="color:#0f172a;font-size:14px;margin:0 0 8px 0;">
              A user has subscribed to promotional emails:
            </p>
            <p style="font-size:16px;color:#0ea5e9;margin:0 0 12px 0;"><strong>${email}</strong></p>
            <p style="color:#334155;font-size:13px;line-height:1.6;margin:0;">
              You can view subscribers in your database or export them for campaigns.
            </p>
          </div>
        </div>
      </div>
    `,
  });
};
