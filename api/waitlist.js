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
import { renderWelcomeEmail } from './_lib/welcome-email.js';

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
        const { subject, text, html } = renderWelcomeEmail({
          name: safeName,
          email: safeEmail,
          referralUrl
        });
        const emailResult = await resend.emails.send({
          from: 'PoolIt <hello@poolit.site>',
          to: [safeEmail],
          subject,
          text,
          html
        });
        // the Resend SDK answers { data, error }; it has no "success" field
        if (emailResult.error) {
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
