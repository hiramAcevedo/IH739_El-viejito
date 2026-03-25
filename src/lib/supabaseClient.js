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

/** Obtiene todos los productos activos (vista publica) */
export async function getProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('nombre')
  if (error) throw error
  return data
}

/** Obtiene un producto por su ID */
export async function getProductoById(id) {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

/** Obtiene TODOS los productos (activos e inactivos, para admin) */
export async function getProductosAdmin() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('nombre')
  if (error) throw error
  return data
}

/** Crea un producto nuevo */
export async function createProducto(producto) {
  const { data, error } = await supabase
    .from('productos')
    .insert(producto)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Actualiza un producto existente */
export async function updateProducto(id, campos) {
  const { data, error } = await supabase
    .from('productos')
    .update(campos)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/** Elimina un producto */
export async function deleteProducto(id) {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', id)
  if (error) throw error
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
