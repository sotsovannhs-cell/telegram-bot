import { Telegraf } from 'telegraf';
import { NextRequest, NextResponse } from 'next/server';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Basic commands
bot.start((ctx) => ctx.reply('Welcome to SecureAttend Bot! Link your account to receive payroll and attendance notifications.'));
bot.command('status', (ctx) => ctx.reply('You are checked in.'));
bot.command('payroll', (ctx) => ctx.reply('Your current payroll: $500'));

// Next.js webhook handler
export async function POST(req: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({ error: 'Telegram Bot Token not configured' }, { status: 500 });
  }

  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
