import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();

    // Basic validation
    if (!data.slug || !data.totalSpent || data.totalSpent <= 0) {
      return NextResponse.json({ error: 'Invalid submission' }, { status: 400 });
    }

    // Rate limiting: basic check via timestamp (real rate limiting would use KV/Redis)
    // For now, just validate the data shape

    const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

    if (webhookUrl) {
      // Forward to Google Sheets via Apps Script webhook
      // Google Apps Script returns 302 redirect; we must follow it manually
      // because fetch converts POST to GET on 302 (losing the body)
      const payload = JSON.stringify({
        businessType: data.businessType || '',
        slug: data.slug || '',
        totalSpent: data.totalSpent,
        year: data.year || '',
        state: data.state || '',
        surprise: data.surprise || '',
        advice: data.advice || '',
        submittedAt: data.submittedAt || new Date().toISOString(),
      });

      let res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        redirect: 'manual',
      });

      // Follow redirect(s) while preserving POST method and body
      if (res.status === 302 || res.status === 301 || res.status === 307) {
        const redirectUrl = res.headers.get('location');
        if (redirectUrl) {
          res = await fetch(redirectUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            redirect: 'manual',
          });
        }
      }
    } else {
      // Fallback: log to server console (submissions still accepted, just not stored externally)
      console.log('[Cost Submission]', JSON.stringify(data));
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Cost submission error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
