<template>
  <main class="contacto-page">
    <section class="hero-section">
      <div class="hero-content">
        <h1>Contacto</h1>
        <p>Estamos aquí para escucharte. Ponte en contacto con nosotros.</p>
      </div>
    </section>

    <section class="contacto-container">
      <div class="container grid">
        <!-- Formulario -->
        <div class="form-wrapper">
          <h2>Envíanos un mensaje</h2>
          <form @submit.prevent="handleSubmit" class="contacto-form">
            <div class="form-group">
              <label for="nombre">Nombre Completo</label>
              <input 
                type="text" 
                id="nombre" 
                v-model="form.nombre" 
                :class="{ 'error': v$.nombre.$error }"
                placeholder="Tu nombre"
              >
              <span v-if="v$.nombre.$error" class="error-msg">El nombre es obligatorio</span>
            </div>

            <div class="form-group">
              <label for="email">Correo Electrónico</label>
              <input 
                type="email" 
                id="email" 
                v-model="form.email" 
                :class="{ 'error': v$.email.$error }"
                placeholder="tu@email.com"
              >
              <span v-if="v$.email.$error" class="error-msg">Ingresa un correo válido</span>
            </div>

            <div class="form-group">
              <label for="mensaje">Mensaje</label>
              <textarea 
                id="mensaje" 
                v-model="form.mensaje" 
                :class="{ 'error': v$.mensaje.$error }"
                rows="5"
                placeholder="¿En qué podemos ayudarte?"
              ></textarea>
              <span v-if="v$.mensaje.$error" class="error-msg">El mensaje no puede estar vacío</span>
            </div>

            <button type="submit" :disabled="isSubmitting" class="submit-btn">
              {{ isSubmitting ? 'Enviando...' : 'Enviar Mensaje' }}
            </button>

            <p v-if="submitted" class="success-msg">¡Gracias! Tu mensaje ha sido enviado con éxito.</p>
          </form>
        </div>

        <!-- Info y Mapa -->
        <div class="info-wrapper">
          <div class="info-item">
            <h3>Nuestra Ubicación</h3>
            <p>Carretera Libre a Zapotlanejo Km. 17.5<br>Tototlán, Jalisco, México.</p>
          </div>
          <div class="map-container">
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14945.891398555845!2d-102.795833!3d20.533333!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjDCsDMyJzAwLjAiTiAxMDLCsDQ3JzQ1LjAiVw!5e0!3m2!1ses-419!2smx!4v1700000000000!5m2!1ses-419!2smx" 
              width="100%" 
              height="350" 
              style="border:0;" 
              allowfullscreen="" 
              loading="lazy" 
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email } from '@vuelidate/validators'

const form = reactive({
  nombre: '',
  email: '',
  mensaje: ''
})

const rules = {
  nombre: { required },
  email: { required, email },
  mensaje: { required }
}

const v$ = useVuelidate(rules, form)
const isSubmitting = ref(false)
const submitted = ref(false)

const handleSubmit = async () => {
  const result = await v$.value.$validate()
  if (!result) return

  isSubmitting.value = true
  
  // Simulación de envío
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  isSubmitting.value = false
  submitted.value = true
  
  // Limpiar formulario
  form.nombre = ''
  form.email = ''
  form.mensaje = ''
  v$.value.$reset()
}
</script>

<style scoped>
.contacto-page {
  background-color: #faf7f2;
}

.hero-section {
  height: 30vh;
  background: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('@/assets/hero-contacto.webp');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.hero-content h1 {
  font-size: 3rem;
  font-family: Georgia, serif;
}

.contacto-container {
  padding: 5rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
}

@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
}

.form-wrapper h2 {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: #1a1a1a;
  font-family: Georgia, serif;
}

.contacto-form {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #444;
}

input, textarea {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

input:focus, textarea:focus {
  outline: none;
  border-color: #c9a84c;
}

input.error, textarea.error {
  border-color: #ff4d4d;
}

.error-msg {
  color: #ff4d4d;
  font-size: 0.85rem;
  margin-top: 0.3rem;
  display: block;
}

.submit-btn {
  width: 100%;
  padding: 1rem;
  background-color: #c9a84c;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.3s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #b08d36;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.success-msg {
  margin-top: 1rem;
  color: #28a745;
  text-align: center;
  font-weight: 600;
}

.info-item h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #1a1a1a;
}

.info-item p {
  color: #666;
  margin-bottom: 2rem;
}

.map-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
</style>
