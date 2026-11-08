<template>
  <footer class="main-footer">
    <div class="footer-container">
      <div class="footer-info">
        <h3>El Viejito</h3>
        <p>Destilando tradición desde hace generaciones.</p>
      </div>
      <div class="footer-social">
        <h4>Síguenos</h4>
        <div class="social-links">
          <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">
            <Facebook :size="22" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">
            <Instagram :size="22" />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener" aria-label="TikTok">
            <Music2 :size="22" />
          </a>
          <a href="https://wa.me/5213312345678" target="_blank" rel="noopener" aria-label="WhatsApp">
            <MessageCircle :size="22" />
          </a>
        </div>
      </div>
      <div class="footer-contact">
        <h4>Contacto</h4>
        <p>Email: contacto@elviejito.com</p>
        <p>Tel: +52 (33) 1234-5678</p>
      </div>
    </div>
    <div class="footer-legal">
      <p class="footer-leyenda">{{ leyenda }}</p>
      <nav class="footer-ligas" aria-label="Avisos legales">
        <RouterLink to="/privacidad">Aviso de privacidad</RouterLink>
        <RouterLink to="/terminos">Términos de venta</RouterLink>
        <RouterLink to="/seguimiento">Rastrear pedido</RouterLink>
      </nav>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Tequila El Viejito. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { Facebook, Instagram, Music2, MessageCircle } from 'lucide-vue-next'
import { leerTextoLegal } from '@/lib/api'

// la leyenda se edita en el panel (Legal); si la API no responde, queda la que exige la venta a mayores
const leyenda = ref('Prohibida la venta a menores de edad.')
onMounted(async () => {
  try {
    leyenda.value = (await leerTextoLegal('leyenda')).contenido
  } catch {
    /* se queda la leyenda base */
  }
})
</script>

<style scoped>
.main-footer {
  background: var(--color-oscuro);
  color: #fff;
  padding: 3rem 1rem 1rem;
  margin-top: 3rem;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  text-align: center;
}

.footer-info h3 {
  color: var(--color-dorado);
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.footer-social h4,
.footer-contact h4 {
  color: var(--color-crema-oscuro);
  margin-bottom: 0.75rem;
}

.footer-social .social-links {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 1rem;
}

.footer-social a {
  color: var(--color-dorado);
  text-decoration: none;
  transition: color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-social a:hover {
  color: var(--color-crema-oscuro);
  transform: scale(1.15);
}

.footer-legal {
  max-width: 1200px;
  margin: 2rem auto 0;
  padding-top: 1.5rem;
  border-top: 1px solid #333;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.footer-leyenda {
  font-weight: 700;
  color: var(--color-crema);
  font-size: 0.9rem;
}

.footer-ligas {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}

.footer-ligas a {
  color: var(--color-crema-oscuro);
  font-size: 0.9rem;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.footer-ligas a:hover { color: var(--color-dorado); }

.footer-bottom {
  border-top: 1px solid #333;
  margin-top: 2rem;
  padding-top: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: var(--color-texto-tenue);
}
</style>
