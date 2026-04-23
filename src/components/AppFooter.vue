<template>
  <footer class="main-footer">
    <div class="footer-container">
      <div class="footer-info">
        <h3>El Viejito</h3>
        <p>Destilando tradicion desde hace generaciones.</p>
      </div>
      <div class="footer-social">
        <h4>Siguenos</h4>
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
    <div class="footer-bottom">
      <p>&copy; 2026 Tequila El Viejito. Todos los derechos reservados.</p>
    </div>
  </footer>
</template>

<script setup>
import { Facebook, Instagram, Music2, MessageCircle } from 'lucide-vue-next'
</script>

<style scoped>
.main-footer {
  background: #1a1a1a;
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
  color: #c9a84c;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.footer-social h4,
.footer-contact h4 {
  color: #f5f0e8;
  margin-bottom: 0.75rem;
}

.footer-social .social-links {
  display: flex;
  justify-content: center;
  gap: 1.25rem;
  margin-top: 1rem;
}

.footer-social a {
  color: #c9a84c;
  text-decoration: none;
  transition: color 0.3s, transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.footer-social a:hover {
  color: #f5f0e8;
  transform: scale(1.15);
}

.footer-bottom {
  border-top: 1px solid #333;
  margin-top: 2rem;
  padding-top: 1.5rem;
  text-align: center;
  font-size: 0.8rem;
  color: #888;
}
</style>
