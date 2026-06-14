import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, telegram_id } = await req.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminGroupId = process.env.TELEGRAM_ADMIN_GROUP_ID;

    if (!token) {
      return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is not set' }, { status: 500 });
    }

    const sendMessage = async (chatId: string, text: string) => {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      return res.ok;
    };

    // Send to admin group
    if (adminGroupId) {
      await sendMessage(adminGroupId, `[ADMIN ALERT] ${message}`);
    }

    // Send to user dm if they have linked telegram_id
    if (telegram_id) {
      await sendMessage(telegram_id, `[DM] ${message}`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to send notification via Telegram:', err);
    return NextResponse.json({ error: 'Failed to notify' }, { status: 500 });
  }
}
