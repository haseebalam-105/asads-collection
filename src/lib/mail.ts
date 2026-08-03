import nodemailer from "nodemailer";
import { Order } from "@/types/product";
import { formatPKR } from "@/lib/format";
import { siteSettings } from "@/lib/settings";

function isEmailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
  );
}

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

function orderItemsHtml(order: Order) {
  return order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;">${i.name.en} ${
        [i.size, i.color].filter(Boolean).length
          ? `<br/><span style="color:#4C6480;font-size:12px;">${[i.size, i.color]
              .filter(Boolean)
              .join(" · ")}</span>`
          : ""
      }</td>
        <td style="padding:8px 0;text-align:center;">${i.quantity}</td>
        <td style="padding:8px 0;text-align:right;">${formatPKR(i.price * i.quantity)}</td>
      </tr>`
    )
    .join("");
}

function baseTemplate(title: string, bodyHtml: string) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0A1220;">
    <div style="background:#0B2A4A;padding:24px;text-align:center;">
      <img src="${siteSettings.logoSrc}" alt="${siteSettings.brandName}" width="48" style="border-radius:50%;" />
      <h1 style="color:#fff;font-size:16px;margin:12px 0 0;">${siteSettings.brandName}</h1>
    </div>
    <div style="padding:24px;border:1px solid #E4E9F1;border-top:none;">
      <h2 style="font-size:18px;">${title}</h2>
      ${bodyHtml}
    </div>
    <p style="text-align:center;color:#4C6480;font-size:12px;margin-top:16px;">
      ${siteSettings.phone} · ${siteSettings.email}
    </p>
  </div>`;
}

export async function sendOrderConfirmationEmail(order: Order) {
  if (!isEmailConfigured()) return;

  const html = baseTemplate(
    "Your order has been placed successfully!",
    `
    <p>Hi ${order.customer.fullName}, thanks for ordering from ${siteSettings.brandName}.</p>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;">
      <thead>
        <tr style="border-bottom:1px solid #E4E9F1;text-align:left;">
          <th style="padding-bottom:8px;">Item</th>
          <th style="padding-bottom:8px;text-align:center;">Qty</th>
          <th style="padding-bottom:8px;text-align:right;">Price</th>
        </tr>
      </thead>
      <tbody>${orderItemsHtml(order)}</tbody>
    </table>
    <div style="margin-top:16px;border-top:1px solid #E4E9F1;padding-top:12px;">
      <p style="display:flex;justify-content:space-between;"><span>Subtotal</span><strong>${formatPKR(order.subtotal)}</strong></p>
      <p style="display:flex;justify-content:space-between;"><span>Delivery</span><strong>${order.deliveryFee === 0 ? "Free" : formatPKR(order.deliveryFee)}</strong></p>
      <p style="display:flex;justify-content:space-between;font-size:16px;"><span>Total</span><strong>${formatPKR(order.total)}</strong></p>
    </div>
    <p style="margin-top:16px;"><strong>Payment:</strong> Cash on Delivery</p>
    <p><strong>Delivery Address:</strong> ${order.customer.address}, ${order.customer.city}</p>
    `
  );

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `"${siteSettings.brandName}" <${siteSettings.email}>`,
    to: order.customer.email,
    subject: `Order Confirmed — ${order.orderNumber}`,
    html,
  });
}

export async function sendOrderStatusUpdateEmail(order: Order) {
  if (!isEmailConfigured()) return;

  const html = baseTemplate(
    "Your order status has been updated",
    `
    <p>Hi ${order.customer.fullName},</p>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p>Your order status is now: <strong style="text-transform:capitalize;">${order.status}</strong></p>
    `
  );

  await getTransporter().sendMail({
    from: process.env.SMTP_FROM || `"${siteSettings.brandName}" <${siteSettings.email}>`,
    to: order.customer.email,
    subject: `Order Update — ${order.orderNumber}`,
    html,
  });
}
