import { createClient } from '@supabase/supabase-js';

export default async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(503).json({
        status: 'degraded',
        message: 'Missing Supabase configuration',
        database: 'unconfigured',
        timestamp: new Date().toISOString(),
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test database connectivity
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return res.status(503).json({
        status: 'unhealthy',
        message: 'Database connection failed',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }

    // All systems healthy
    return res.status(200).json({
      status: 'ok',
      message: 'PoolIt service is running',
      database: 'connected',
      waitlistCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};
