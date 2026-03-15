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
          <a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a>
          <a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a>
          <a href="https://tiktok.com" target="_blank" rel="noopener">TikTok</a>
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

.footer-social .social-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
}

.footer-social a {
  color: #c9a84c;
  text-decoration: none;
  transition: opacity 0.3s;
}

.footer-social a:hover {
  opacity: 0.8;
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
