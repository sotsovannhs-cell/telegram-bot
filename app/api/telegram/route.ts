import { Telegraf } from 'telegraf';
import { NextRequest, NextResponse } from 'next/server';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

bot.start((ctx) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://example.com';
  ctx.reply('Welcome to SecureAttend! Open the Mini App to Check-in:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Open App', web_app: { url: appUrl } }]
      ]
    }
  });
});

bot.command('link', (ctx) => {
  const parts = ctx.message.text.split(' ');
  if (parts.length < 2) {
    return ctx.reply('Please provide your Employee ID. Example: /link E001');
  }
  const employeeId = parts[1].toUpperCase();
  const telegramId = ctx.from.id.toString();

  ctx.reply(`Account ${employeeId} linked with Telegram ID ${telegramId}!`);
});

bot.command('status', (ctx) => ctx.reply('You are checked in.'));
bot.command('payroll', (ctx) => ctx.reply('Your current payroll: $500'));

// Next.js webhook handler
export async function POST(req: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    
    // Manual send from PayrollTab or other API endpoints
    if (body.action === 'send' && body.chat_id && body.text) {
      await bot.telegram.sendMessage(body.chat_id, body.text, { parse_mode: 'Markdown' });
      return NextResponse.json({ ok: true });
    }

    // Otherwise, treat as Telegram HTTP Webhook update
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
