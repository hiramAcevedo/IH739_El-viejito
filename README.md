# Tequila El Viejito — Sistema Web
**Proyecto VII (IH739) | Universidad de Guadalajara — Sistema de Universidad Virtual**

---

## 👥 Equipo

| Rol | Integrante |
|-----|------------|
| Product Owner (PO) | Marcela López |
| Scrum Master (SM) | Aritzai Silva |
| Developer (DEV) | Hiram Acevedo |
| Developer (DEV) | Daniel Aguilar |

**Asesor:** Sergio Ulises Lillingston Pérez

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Vue 3 + Vite |
| Routing | Vue Router 4 |
| Estado | Pinia |
| Backend as a Service | Supabase (PostgreSQL + Auth + Storage) |
| Slider | Swiper.js 11 |
| Calidad de código | ESLint + Prettier |

---

## 🚀 Sprint 1 — Incremento entregado

**Periodo:** 14 feb – 20 feb 2026

### Completado en este sprint

- ✅ Inicialización del proyecto Vue 3 + Vite con ESLint y Prettier configurados
- ✅ Estructura de carpetas y repositorio Git
- ✅ Vue Router con las 4 rutas principales (lazy-loading)
- ✅ Cliente Supabase configurado vía variables de entorno
- ✅ Landing Page: Hero fullscreen + Slider de productos (Swiper.js) + Sección bienvenida
- ✅ NavBar responsive con menú hamburguesa para móvil

### En progreso / próximo sprint

- 🔲 Sección "Nosotros" (Sprint 2 – PB4)
- 🔲 Formulario de contacto + Google Maps (Sprint 2 – PB5)
- 🔲 Footer con redes sociales (Sprint 2 – PB15)
- 🔲 Catálogo completo conectado a Supabase (Sprint 2 – PB2)

---

## 💻 Instalación local

```bash
# 1. Clonar el repositorio
git clone https://github.com/4liyat/IH739_El-viejito.git
cd IH739_El-viejito

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales de Supabase

# 4. Correr en modo desarrollo
npm run dev
```

> El servidor estará disponible en `http://localhost:5173`

---

## 📁 Estructura del proyecto

```
src/
├── components/
│   └── NavBar.vue          # Navegación responsive
├── lib/
│   └── supabaseClient.js   # Cliente y helpers de Supabase
├── router/
│   └── index.js            # Vue Router (4 rutas)
├── views/
│   ├── HomeView.vue        # Landing page (Hero + Slider + Bienvenida)
│   ├── NosotrosView.vue    # Sprint 2
│   ├── ProductosView.vue   # Sprint 2
│   └── ContactoView.vue    # Sprint 2
├── App.vue
└── main.js
```

---

*Licenciatura en Desarrollo de Sistemas Web — UDG Virtual*