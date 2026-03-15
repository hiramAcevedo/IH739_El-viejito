<template>
  <main class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">Panel de Administración</h1>
        <p class="login-subtitle">Acceso restringido</p>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <!-- Email input -->
        <div class="form-group">
          <label for="email" class="form-label">Correo Electrónico</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            class="form-input"
            placeholder="admin@example.com"
            required
            :disabled="authStore.loading"
          />
        </div>

        <!-- Password input -->
        <div class="form-group">
          <label for="password" class="form-label">Contraseña</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            class="form-input"
            placeholder="••••••••"
            required
            :disabled="authStore.loading"
          />
        </div>

        <!-- Error message -->
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <!-- Submit button -->
        <button
          type="submit"
          class="btn-login"
          :disabled="authStore.loading"
        >
          <span v-if="!authStore.loading">Ingresar</span>
          <span v-else>Cargando...</span>
        </button>
      </form>

      <div class="login-footer">
        <p class="login-hint">
          Este panel es solo para administradores de Tequila El Viejito
        </p>
      </div>
    </div>
  </main>
</template>

<script setup>
  import { ref, reactive } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/authStore'

  const router = useRouter()
  const authStore = useAuthStore()

  const formData = reactive({
    email: '',
    password: ''
  })
  const errorMessage = ref('')

  async function handleLogin() {
    errorMessage.value = ''

    // Basic validation
    if (!formData.email || !formData.password) {
      errorMessage.value = 'Por favor completa todos los campos'
      return
    }

    const { success, error } = await authStore.login(
      formData.email,
      formData.password
    )

    if (success) {
      // Check if user is admin
      if (!authStore.isAdmin) {
        errorMessage.value =
          'No tienes permisos de administrador'
        // Sign out non-admin user
        await authStore.logout()
        return
      }

      // Redirect to admin dashboard
      router.push('/admin')
    } else {
      errorMessage.value =
        error || 'Error al iniciar sesión. Intenta nuevamente.'
    }
  }
</script>

<style scoped>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #faf7f2;
    padding: 1.5rem;
  }

  .login-card {
    width: 100%;
    max-width: 420px;
    background: white;
    padding: 3rem 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  }

  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .login-title {
    font-family: Georgia, serif;
    font-size: 2rem;
    color: #1a1a1a;
    margin: 0 0 0.5rem;
  }

  .login-subtitle {
    font-size: 0.95rem;
    color: #c9a84c;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin: 0;
    font-weight: 600;
  }

  .login-form {
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-label {
    display: block;
    font-size: 0.9rem;
    color: #1a1a1a;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  .form-input {
    width: 100%;
    padding: 0.85rem 1rem;
    font-size: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: #faf7f2;
    color: #1a1a1a;
    transition: border-color 0.2s, background-color 0.2s;
    font-family: inherit;
  }

  .form-input:focus {
    outline: none;
    border-color: #c9a84c;
    background: white;
  }

  .form-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .form-input::placeholder {
    color: #aaa;
  }

  .error-message {
    padding: 0.85rem 1rem;
    margin-bottom: 1.5rem;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 4px;
    color: #c00;
    font-size: 0.9rem;
  }

  .btn-login {
    width: 100%;
    padding: 0.95rem 1.5rem;
    background: #c9a84c;
    color: #1a1a1a;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.2s;
  }

  .btn-login:hover:not(:disabled) {
    background: #e0c068;
    transform: translateY(-1px);
  }

  .btn-login:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .login-footer {
    text-align: center;
  }

  .login-hint {
    font-size: 0.85rem;
    color: #666;
    margin: 0;
  }

  @media (max-width: 480px) {
    .login-card {
      padding: 2rem 1.5rem;
    }

    .login-title {
      font-size: 1.6rem;
    }
  }
</style>
