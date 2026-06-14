import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { differenceInMinutes } from 'date-fns';
import { toZonedTime, format as formatTz } from 'date-fns-tz';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json({ success: false, message: 'No TELEGRAM_BOT_TOKEN set' });
    }

    // Paginate every query (.range) to avoid the 1000-row cap.
    let allUsers: any[] = [];
    let hasMoreUsers = true;
    let uPage = 0;
    while (hasMoreUsers) {
      const { data, error } = await supabase.from('users').select('*').range(uPage * 999, (uPage + 1) * 999 - 1);
      if (error || !data || data.length === 0) {
        hasMoreUsers = false;
      } else {
        allUsers = [...allUsers, ...data];
        uPage++;
      }
    }

    if (allUsers.length === 0) {
       return NextResponse.json({ success: true, message: 'No users found or lack of DB setup' });
    }

    let allCheckins: any[] = [];
    let hasMoreLogs = true;
    let lPage = 0;
    while (hasMoreLogs) {
      const { data, error } = await supabase.from('attendance_logs').select('*').range(lPage * 999, (lPage + 1) * 999 - 1);
      if (error || !data || data.length === 0) {
        hasMoreLogs = false;
      } else {
        allCheckins = [...allCheckins, ...data];
        lPage++;
      }
    }

    // Process and send Telegram payslips manually 
    let sentCount = 0;
    for (const emp of allUsers) {
      if (!emp.telegram_chat_id) continue;

      const empCheckins = allCheckins.filter(c => c.user_id === emp.id);
      const ins = empCheckins.filter(c => c.check_type === 'check_in');
      const outs = empCheckins.filter(c => c.check_type === 'check_out');
      
      let lates = 0;
      let totalHours = 0;
      
      ins.forEach(ci => {
        const checkinDt = new Date(ci.timestamp);
        const zonedDt = toZonedTime(checkinDt, 'Asia/Phnom_Penh');
        
        const startDt = new Date(zonedDt);
        startDt.setHours(8, 0, 0, 0); // Default 08:00
        
        if (zonedDt > startDt) {
          lates++;
        }
        
        const matchingOut = outs.find(co => {
           const zonedOut = toZonedTime(new Date(co.timestamp), 'Asia/Phnom_Penh');
           return formatTz(zonedOut, 'yyyy-MM-dd') === formatTz(zonedDt, 'yyyy-MM-dd');
        });

        if (matchingOut) {
          const coTime = new Date(matchingOut.timestamp);
          totalHours += differenceInMinutes(coTime, checkinDt) / 60;
        } else {
          totalHours += 8;
        }
      });

      // Default calculation if not using `localStorage` configs
      // In production this would pull from payroll_records or use accurate rates
      const rate = 500; // placeholder 
      let basePay = rate;
      let deduction = lates * 5; 
      let netPay = basePay - deduction;

      const msg = `🧾 *ប័ណ្ណបើកប្រាក់បៀវត្សរ៍ប្រចាំខែ*\n👤 ឈ្មោះ: ${emp.full_name}\n💰 ប្រាក់គោល: $${basePay.toFixed(2)}\n📉 កាត់ប្រាក់(យឺត/អវត្តមាន): -$${deduction}\n✅ *ចំនួនប្រាក់ត្រូវបើកសរុប: $${netPay.toFixed(2)}*`;

      try {
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: emp.telegram_chat_id, text: msg, parse_mode: 'Markdown' })
        });
        sentCount++;
      } catch (err) {
        console.error('Failed to send to', emp.telegram_chat_id);
      }
    }

    return NextResponse.json({ success: true, message: `Payslips sent to ${sentCount} users.` });

  } catch (err) {
     return NextResponse.json({ success: false, error: String(err) });
  }
}
