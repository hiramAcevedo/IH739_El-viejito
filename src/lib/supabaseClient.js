import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Variables de entorno no configuradas. ' +
    'Copia .env.example a .env y agrega tus credenciales.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ──────────────────────────────────────────────
// Helpers de ejemplo para las tablas del Sprint 1
// ──────────────────────────────────────────────

/** Obtiene todos los productos activos */
export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data
}

/** Obtiene todos los pedidos (solo admin via RLS) */
export async function getPedidos() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, productos(nombre)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
