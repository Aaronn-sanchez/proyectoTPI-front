# Cozzy & Cosso — Frontend (juego web)

Cliente web del videojuego **Cozzy & Cosso**, un juego 2D de plataformas y acertijos ambientado en un humedal. El jugador controla a un **carpincho** (camina, salta, nada y empuja objetos) y a un **benteveo** (vuela), supera obstáculos y aprende sobre el cuidado del ecosistema.

> Trabajo de la **Trayectoria Pedagógica Interdisciplinaria (TPI)** — Técnico en Programación, Colegio Olga Bronzovich de Arko, 7°1, 2026.
> **Autores:** Solange Katherina Montaño Rodríguez y Aarón Alexander Sanchez.
> **Docentes:** Thiago Pizarro, Damián Greco y Antonella Valle.

Este repositorio es solo el **cliente**. Necesita que el servidor (repositorio del backend) esté funcionando para poder iniciar sesión y guardar el progreso.

---

## Tecnologías

React 19 · Vite · Phaser 4 (física Matter.js) · wouter · axios · LDtk (niveles) · Krita (arte)

---

## Guía de instalación

### 1. Requisitos previos

| Programa | Versión recomendada | Para qué sirve |
|---|---|---|
| [Node.js](https://nodejs.org/) | 20 LTS o superior | Ejecutar el proyecto (incluye `npm`) |
| [Git](https://git-scm.com/) | Cualquiera | Descargar el proyecto |
| Backend de Cozzy & Cosso | — | Cuentas, progreso y guardados |

Para comprobar que Node y npm están instalados:

```bash
node -v
npm -v
```

### 2. Dejar el backend funcionando

Antes de abrir el juego, seguí la guía del repositorio del **backend** y dejalo corriendo. Por defecto queda en `http://localhost:3000`.

### 3. Descargar el proyecto

```bash
git clone <URL-DE-ESTE-REPOSITORIO>
cd <carpeta-del-proyecto>
```

> La carpeta `design/` contiene los archivos fuente de Krita (`.kra`), que se guardan con Git LFS. **No son necesarios para correr el juego**, así que podés ignorarlos.

### 4. Instalar las dependencias

```bash
npm install
```

### 5. Configurar las variables de entorno

Creá un archivo llamado `.env` en la **raíz del proyecto** (al lado de `package.json`):

```env
VITE_API_URL=http://localhost:3000
VITE_DEBUG=false
```

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | Dirección donde está corriendo el backend. Si cambiaste el `PORT` del backend, cambialo acá también. |
| `VITE_DEBUG` | Con `true` (solo en desarrollo) se dibujan los cuerpos de la física del juego. Útil para depurar. |

> Si cambiás el `.env`, reiniciá el servidor de desarrollo para que tome los cambios.

### 6. Iniciar el juego

```bash
npm run dev
```

La terminal muestra una dirección como esta:

```
Local:   http://localhost:5173/
```

Abrila en el navegador (se recomienda Chrome, Edge o Firefox en una computadora).

### 7. Probar el juego

1. Hacé clic en **Registrarse** y creá una cuenta (la contraseña debe tener al menos 8 caracteres).
2. Desde el menú principal entrá a **Jugar** y elegí el **Tutorial básico**.
3. Para guardar partidas, apretá `Esc` y usá el panel de la pausa.

---

## Otros comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Inicia el servidor de desarrollo con recarga automática |
| `npm run build` | Genera la versión optimizada en la carpeta `dist/` |
| `npm run preview` | Prueba localmente la versión generada con `build` |
| `npm run lint` | Revisa el código con Oxlint |

---

## Controles

| Acción | Teclas |
|---|---|
| Moverse | Flechas o `A` / `D` |
| Saltar | `↑`, `W` o `Espacio` |
| Bucear (en el agua) | `↓` o `S` |
| Pausa | `Esc` o botón **Menú** |

---

## Problemas frecuentes

| Problema | Causa y solución |
|---|---|
| Al registrarme o iniciar sesión dice *No se pudo conectar con el servidor* | El backend no está encendido o `VITE_API_URL` apunta a una dirección equivocada. |
| Los niveles aparecen todos bloqueados | El backend falló al cargar el progreso. Revisá la terminal del backend y que `TOTAL_NIVELES` esté en su `.env`. |
| La app me manda siempre al login | El token venció o es inválido. Volvé a iniciar sesión. |
| Pantalla de carga con error al entrar a un nivel | Falta algún archivo de `public/assets/` (sprites, audio o el `.json` del nivel). Revisá la consola del navegador (`F12`). |
| Error `vite: command not found` | No se instalaron las dependencias. Ejecutá `npm install`. |
| El puerto 5173 está ocupado | Vite elige otro automáticamente; usá la dirección que muestre la terminal. |

---

## Funcionalidades

- Registro, inicio de sesión y cierre de sesión con token JWT.
- Mapa de niveles que bloquea los niveles según el progreso del jugador.
- Nivel jugable: **Tutorial básico** (el resto de los niveles está en desarrollo).
- Menú de pausa con hasta 5 partidas guardadas por nivel.
- Puntos de control: al tocar un peligro, el personaje reaparece en el último checkpoint.
- Pantalla de carga con datos curiosos sobre carpinchos, benteveos y humedales.
- Ajustes de música, idioma y hasta 3 perfiles de configuración.
- Logros con barra de progreso.
- **Rol QA Tester:** corona en el perfil, cajas violetas y acceso a todos los niveles.

---

## Estructura del proyecto

```
public/assets/        # Sprites, audio y niveles (.json exportados de LDtk)
design/               # Archivos fuente de Krita (.kra)
src/
├── main.jsx, App.jsx # Entrada y rutas de la app
├── api/              # Llamadas al backend (axios)
├── componentes/      # Cajas, layout, pausa, perfil, nivel completado, panel QA
├── pages/            # Pantallas: login, registro, menú, niveles, ajustes, logros, juego
├── context/          # Datos curiosos de la pantalla de carga
└── game/             # Juego con Phaser: escenas, personajes, agua y sistemas de nivel
```

El juego se monta dentro de React en `src/pages/juego.jsx`, que se comunica con la escena de Phaser mediante eventos (`nivel-listo`, `nivel-completado`, `nivel-error-carga`).