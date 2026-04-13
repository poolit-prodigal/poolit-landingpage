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
      return res.status(200).json({ success: true, ref_code: existing.data.ref_code });
    }

    const refCode = generateRefCode();

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
          return res.status(200).json({ success: true, ref_code: dupe.data.ref_code });
        }
      }
      console.error('Insert error:', insertError.message);
      return res.status(500).json({ message: 'Could not process signup right now.' });
    }

    try {
      const resend = getResend();
      if (resend) {
        const emailResult = await resend.emails.send({
          from: 'PoolIt <hello@poolit.site>',
          to: [safeEmail],
          subject: "You're on the PoolIt waitlist 🎉",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #1B6B4D 0%, #0f5a3f 100%); padding: 2rem; border-radius: 12px; color: white; text-align: center; margin-bottom: 2rem;">
                <h1 style="margin: 0; font-size: 28px;">Welcome to PoolIt!</h1>
                <p style="margin: 0.5rem 0 0; opacity: 0.9;">You're on the waitlist 🎉</p>
              </div>
              
              <h2 style="color: #1B6B4D; margin-top: 0;">Hi ${safeName},</h2>
              
              <p style="color: #333; line-height: 1.6;">You've successfully joined the PoolIt waitlist. We'll notify you with your early access link the moment we launch.</p>
              
              <div style="background: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin: 2rem 0; border-left: 4px solid #1B6B4D;">
                <p style="margin: 0 0 1rem; font-weight: 600; color: #1B6B4D;">Move Up the List 📈</p>
                <p style="margin: 0; color: #666; font-size: 14px;">Invite friends and move up the queue. Every referral gets you closer to exclusive early access.</p>
                <p style="margin: 1rem 0 0; font-size: 13px; color: #999;">Your referral link:</p>
                <p style="margin: 0.5rem 0 0; word-break: break-all;"><code style="background: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-family: monospace;">https://poolit.site?ref=${refCode}</code></p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin: 2rem 0 0;">Questions? Reply to this email or contact us at support@poolit.site</p>
              
              <p style="color: #999; font-size: 12px; margin: 1rem 0 0; padding-top: 1rem; border-top: 1px solid #ddd;">— The PoolIt Team<br/>Building community savings across Nigeria</p>
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
