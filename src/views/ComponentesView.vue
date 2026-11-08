<template>
  <main class="muestra">
    <header class="muestra__cabeza">
      <h1>Componentes compartidos</h1>
      <p>Página de muestra del sprint 4: cada componente con sus estados. Sólo existe en el servidor de desarrollo.</p>
    </header>

    <section class="muestra__bloque">
      <h2>Variables de diseño</h2>
      <div class="muestras-color">
        <div v-for="c in colores" :key="c.var" class="muestra-color">
          <span class="muestra-color__chip" :style="{ background: `var(${c.var})` }"></span>
          <code>{{ c.var }}</code><small>{{ c.uso }}</small>
        </div>
      </div>
      <p class="tipos"><span class="tipos__titulo">Georgia en los títulos</span> · <span>la fuente del sistema en el cuerpo</span></p>
    </section>

    <section class="muestra__bloque">
      <h2>BotonPrimario</h2>
      <div class="fila">
        <BotonPrimario>Pagar $1,832.80</BotonPrimario>
        <BotonPrimario cargando>Procesando</BotonPrimario>
        <BotonPrimario disabled>Pagar</BotonPrimario>
        <BotonPrimario variante="secundario">Volver al carrito</BotonPrimario>
      </div>
    </section>

    <section class="muestra__bloque muestra__rejilla">
      <div>
        <h2>ResumenPedido</h2>
        <ResumenPedido :cotizacion="cotizacion" />
      </div>
      <div>
        <h2>ResumenPedido calculando</h2>
        <ResumenPedido :lineas="cotizacion.lineas.map(({ subtotal, ...l }) => l)" calculando />
      </div>
    </section>

    <section class="muestra__bloque muestra__rejilla">
      <div>
        <h2>ConfirmacionEdad</h2>
        <ConfirmacionEdad v-model="edad" />
        <p class="nota">Marcada: {{ edad ? 'sí' : 'no' }}</p>
      </div>
      <div>
        <h2>EstadoPago</h2>
        <div class="columna">
          <div class="fila"><EstadoPago v-for="e in estados" :key="e" :estado="e" /></div>
          <div class="fila"><EstadoPago v-for="e in estados" :key="e + 'l'" :estado="e" forma="larga" /></div>
        </div>
      </div>
    </section>

    <section class="muestra__bloque muestra__rejilla">
      <div>
        <h2>SelectorEntrega</h2>
        <SelectorEntrega v-model:metodo="metodo" v-model:direccion="direccion" />
      </div>
      <div>
        <h2>LineaSeguimiento</h2>
        <LineaSeguimiento :pasos="pasos" />
        <h2 class="separado">FormularioSeguimiento</h2>
        <FormularioSeguimiento />
      </div>
    </section>

    <section class="muestra__bloque">
      <h2>Las pantallas de regreso con su estado de ejemplo</h2>
      <div class="fila">
        <RouterLink to="/pago/confirmado?session_id=cs_ejemplo_pagada">Pagada</RouterLink>
        <RouterLink to="/pago/pendiente?session_id=cs_ejemplo_abierta">Abierta sin pagar</RouterLink>
        <RouterLink to="/pago/error?session_id=cs_ejemplo_caducada">Caducada</RouterLink>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import BotonPrimario from '@/components/compartidos/BotonPrimario.vue'
import ResumenPedido from '@/components/compartidos/ResumenPedido.vue'
import ConfirmacionEdad from '@/components/compartidos/ConfirmacionEdad.vue'
import SelectorEntrega from '@/components/compartidos/SelectorEntrega.vue'
import EstadoPago from '@/components/compartidos/EstadoPago.vue'
import LineaSeguimiento from '@/components/compartidos/LineaSeguimiento.vue'
import FormularioSeguimiento from '@/components/compartidos/FormularioSeguimiento.vue'

const colores = [
  { var: '--color-crema', uso: 'fondo' },
  { var: '--color-dorado', uso: 'marca y botón primario' },
  { var: '--color-texto', uso: 'texto, también sobre el dorado' },
  { var: '--color-texto-2', uso: 'texto secundario' },
  { var: '--color-borde', uso: 'bordes' },
  { var: '--color-error', uso: 'errores' }
]
const cotizacion = {
  lineas: [
    { id: 'a', nombre: 'Reposado Suave', cantidad: 2, subtotal: '900.00' },
    { id: 'b', nombre: 'Añejo Premium', cantidad: 1, subtotal: '680.00' }
  ],
  subtotal: '1580.00', iva: '252.80', envio: '0.00', total: '1832.80'
}
const estados = ['pagado', 'pendiente', 'rechazado', 'reembolsado', 'confirmando']
const edad = ref(true)
const metodo = ref('envio')
const direccion = ref({ calle: 'Av. Juárez 1450, int. 3', colonia: 'Americana', codigo_postal: '44160', ciudad: 'Guadalajara', estado: 'Jalisco' })
const pasos = [
  { etiqueta: 'Pagado', fecha: '2026-11-05T10:26:00-06:00', hecho: true },
  { etiqueta: 'Confirmado', fecha: '2026-11-05T13:10:00-06:00', hecho: true },
  { etiqueta: 'Enviado', fecha: '2026-11-06T11:45:00-06:00', hecho: true },
  { etiqueta: 'Entrega estimada', fecha: '2026-11-09T12:00:00-06:00', hecho: false }
]
</script>

<style scoped>
.muestra { max-width: 1200px; margin: 0 auto; padding: 6rem var(--espacio-4) var(--espacio-8); }
.muestra__cabeza h1 { font-family: var(--fuente-titulos); font-size: 2.2rem; color: var(--color-texto); }
.muestra__cabeza p { color: var(--color-texto-2); margin-bottom: var(--espacio-6); }
.muestra__bloque { background: var(--color-blanco); border-radius: var(--radio-grande); box-shadow: var(--sombra); padding: var(--espacio-5); margin-bottom: var(--espacio-5); }
.muestra__bloque h2 { font-family: var(--fuente-mono); font-size: 0.9rem; font-weight: 600; color: var(--color-texto-2); margin-bottom: var(--espacio-3); }
.muestra__rejilla { display: grid; grid-template-columns: 1fr; gap: var(--espacio-6); }
.fila { display: flex; flex-wrap: wrap; gap: var(--espacio-3); align-items: center; }
.columna { display: flex; flex-direction: column; gap: var(--espacio-3); }
.separado { margin-top: var(--espacio-6); }
.nota { color: var(--color-texto-2); font-size: 0.85rem; margin-top: var(--espacio-2); }
.muestras-color { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: var(--espacio-3); }
.muestra-color { display: grid; grid-template-columns: 40px 1fr; grid-template-rows: auto auto; column-gap: var(--espacio-2); align-items: center; }
.muestra-color__chip { grid-row: span 2; width: 40px; height: 40px; border-radius: var(--radio); border: 1px solid var(--color-borde); }
.muestra-color code { font-size: 0.8rem; color: var(--color-texto); }
.muestra-color small { color: var(--color-texto-2); font-size: 0.75rem; }
.tipos { margin-top: var(--espacio-4); color: var(--color-texto-2); }
.tipos__titulo { font-family: var(--fuente-titulos); font-size: 1.2rem; color: var(--color-texto); }
@media (min-width: 768px) { .muestra__rejilla { grid-template-columns: 1fr 1fr; } }
</style>
