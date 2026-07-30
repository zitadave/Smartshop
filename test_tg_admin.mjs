const ADMIN_BOT_TOKEN = '8951025148:AAG456KIIBnyLBQqbkeDLajcT_TaPSYCIYc';
const ADMIN_CHAT_ID = '336997351';

async function run() {
  const txt = `🛍 <b>New Order Test Admin Bot</b>\n\n` +
    `💵 Total: <b>Br 500</b>\n` +
    `💳 Payment: <b>COD</b>\n` +
    `👤 Customer: <b>Diag User</b>\n` +
    `📞 Phone: <code>0911223344</code>\n\n` +
    `📦 <b>Items:</b>\n  • Test Item (x1)`;

  const res = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: ADMIN_CHAT_ID,
      text: txt,
      parse_mode: 'HTML',
      disable_web_page_preview: true
    })
  });
  console.log('STATUS:', res.status);
  const data = await res.json();
  console.log('RESPONSE:', data);
}

run();
