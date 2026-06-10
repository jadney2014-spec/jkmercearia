// Configuração do Supabase
const { createClient } = require('@supabase/supabase-js');

// URLs e chaves do Supabase (configure no Netlify)
const supabaseUrl = process.env.SUPABASE_URL || 'https://seu-projeto.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sua-chave-anonima';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sua-chave-service-role';

// Cliente para operações públicas (frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente para operações administrativas (backend)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

module.exports = {
  supabase,
  supabaseAdmin,
  supabaseUrl,
  supabaseAnonKey
};
