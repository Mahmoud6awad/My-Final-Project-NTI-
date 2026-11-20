import nodemailer from 'nodemailer';

export async function sendOrderAcceptedEmail(order) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  const recipient = process.env.ORDER_NOTIFICATION_EMAIL;
  const port = Number(SMTP_PORT);
  if (!SMTP_HOST || !Number.isInteger(port) || !SMTP_USER || !SMTP_PASS || !recipient) {
    throw new Error('Email notification is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and ORDER_NOTIFICATION_EMAIL.');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  await transporter.sendMail({
    from: SMTP_USER,
    to: recipient,
    subject: `تم قبول الطلب ${order.orderNumber} | Order accepted`,
    text: `تم قبول طلبك.\nرقم الطلب: ${order.orderNumber}\nالعميل: ${order.customerName}\nالإجمالي: ${order.total.toFixed(2)} جنيه مصري\n\nYour order has been accepted.\nOrder number: ${order.orderNumber}\nCustomer: ${order.customerName}\nTotal: EGP ${order.total.toFixed(2)}`
  });
}
