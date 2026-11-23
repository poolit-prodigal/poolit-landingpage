/*
Supabase table reference:
CREATE TABLE waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  ref_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
*/

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function generateRefCode() {
  return crypto.randomBytes(4).toString('hex');
}

export default async function handler(req, res) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ message: 'Server is missing required configuration.' });
    }

    const { name, email, phone, referredBy } = req.body || {};
    const safeName = String(name || '').trim();
    const safeEmail = String(email || '').trim().toLowerCase();
    const safePhone = phone ? String(phone).trim() : null;
    const safeReferredBy = referredBy ? String(referredBy).trim() : null;

    if (!safeName || !safeEmail || !isEmail(safeEmail)) {
      return res
        .status(400)
        .json({ message: 'Name and a valid email are required.' });
    }

    const existing = await supabase
      .from('waitlist')
      .select('ref_code')
      .eq('email', safeEmail)
      .maybeSingle();

    if (existing.error && existing.error.code !== 'PGRST116') {
      console.error('Lookup error:', existing.error.message);
      return res.status(500).json({ message: 'Could not process signup right now.' });
    }

    if (existing.data?.ref_code) {
      return res.status(200).json({ success: true, already_joined: true, ref_code: existing.data.ref_code });
    }

    const refCode = generateRefCode();
    const referralUrl = `https://poolit.site/?ref=${encodeURIComponent(refCode)}`;

    const { error: insertError } = await supabase.from('waitlist').insert({
      name: safeName,
      email: safeEmail,
      phone: safePhone,
      ref_code: refCode,
      referred_by: safeReferredBy
    });

    if (insertError) {
      if (insertError.code === '23505') {
        const dupe = await supabase
          .from('waitlist')
          .select('ref_code')
          .eq('email', safeEmail)
          .maybeSingle();
        if (dupe.data?.ref_code) {
          return res.status(200).json({ success: true, already_joined: true, ref_code: dupe.data.ref_code });
        }
      }
      console.error('Insert error:', insertError.message);
      return res.status(500).json({ message: 'Could not process signup right now.' });
    }

    try {
      const resend = getResend();
      if (resend) {
        const firstName = escapeHtml(safeName.split(/\s+/)[0]);
        const emailResult = await resend.emails.send({
          from: 'PoolIt <hello@poolit.site>',
          to: [safeEmail],
          subject: "You're on the PoolIt list",
          text: `Hi ${safeName.split(/\s+/)[0]},

You're on the PoolIt waitlist. We'll email you when PoolIt is ready in your neighbourhood—so you can split the bill and keep the stream.

Know someone you'd share a subscription with? Send them your invite link. Their signup will be connected to yours:
${referralUrl}

Questions? Reply to this email or write to hello@poolit.site.

PoolIt
Split the bill. Keep the stream.
poolit.site`,
          html: `
            <div style="margin:0;padding:32px 12px;background:#F3F6F2;font-family:Arial,Helvetica,sans-serif;color:#0E1A15;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;">
                <tr>
                  <td style="padding:0 0 14px 2px;font-size:13px;font-weight:700;letter-spacing:2px;color:#0D6B4E;">POOLIT<span style="color:#F0A500;">.</span></td>
                </tr>
                <tr>
                  <td style="background:#FFFFFF;border:1px solid #E6ECE8;border-radius:8px;overflow:hidden;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr><td height="6" style="height:6px;background:#0D6B4E;font-size:0;line-height:0;">&nbsp;</td></tr>
                      <tr>
                        <td style="padding:34px 34px 12px;">
                          <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#5B6B63;">Your waitlist note</p>
                          <h1 style="margin:0;font-size:32px;line-height:1.15;letter-spacing:-1px;color:#0E1A15;">You're on the list<span style="color:#F0A500;">.</span></h1>
                          <p style="margin:22px 0 0;font-size:16px;line-height:1.65;color:#26362F;">Hi ${firstName},</p>
                          <p style="margin:10px 0 0;font-size:16px;line-height:1.65;color:#26362F;">You're on the PoolIt waitlist. We'll email you when PoolIt is ready in your neighbourhood—so you can split the bill and keep the stream.</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:18px 34px 30px;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#F3F6F2;border:1px solid #E6ECE8;border-radius:6px;">
                            <tr><td style="padding:18px 18px 8px;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#0D6B4E;">Pass the invite along</td></tr>
                            <tr><td style="padding:0 18px 14px;font-size:14px;line-height:1.55;color:#405148;">Know someone you'd share a subscription with? Send them this link. Their signup will be connected to yours.</td></tr>
                            <tr><td style="padding:0 18px 18px;">
                              <a href="${referralUrl}" style="display:inline-block;padding:11px 16px;background:#0D6B4E;border-radius:4px;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;">Share your invite</a>
                            </td></tr>
                            <tr><td style="padding:0 18px 18px;font-size:12px;line-height:1.5;word-break:break-all;color:#5B6B63;">${referralUrl}</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 2px 0;font-size:13px;line-height:1.6;color:#5B6B63;">Questions? Reply to this email or write to <a href="mailto:hello@poolit.site" style="color:#0D6B4E;text-decoration:underline;">hello@poolit.site</a>.</td>
                </tr>
                <tr>
                  <td style="padding:12px 2px 0;font-size:12px;line-height:1.5;color:#718078;">PoolIt · Split the bill. Keep the stream.</td>
                </tr>
              </table>
            </div>
          `
        });
        if (!emailResult.success) {
          console.warn('Resend email not sent:', emailResult.error);
        }
      }
    } catch (emailError) {
      console.error('Resend error:', emailError.message);
    }

    return res.status(200).json({ success: true, ref_code: refCode });
  } catch (error) {
    console.error('Unhandled waitlist error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
