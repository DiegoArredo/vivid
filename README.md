# 🚀Vivid — Tu próxima aventura te espera

**Proyecto:** Vivid: Planificador de eventos geolocalizados  
**Curso:** CC4401 - Ingeniería de Software   
**Equipo 2:** Lucciano Aguilar, Diego Arredondo, Pablo Reyes, Matías Saavedra
**Profesores:** Jocelyn Simmonds  
**Ayudantes:** Jannis Isabel Cruz, Nicolás Grandón  
**Auxiliar:** Joel Riquelme  
**Fecha:** Noviembre 2025  

---

## Descripción General

**Vivid** es una aplicación web planificadora de eventos basada en **geolocalización** que busca **reconectar a las personas con su entorno local**. Su objetivo es facilitar el descubrimiento, la difusión y la organización de actividades presenciales, como conciertos, ferias, encuentros deportivos o culturales, mediante una interfaz centrada en un **mapa interactivo** y una **lista dinámica de eventos**.

Más que una herramienta tecnológica, **Vivid es una propuesta social**: frente a un ecosistema digital que promueve el aislamiento y la interacción virtual, este proyecto busca fomentar experiencias reales y fortalecer la vida comunitaria, incentivando a los usuarios a participar en actividades cercanas y significativas.

---

## Problemática y Motivación

Vivimos en una era donde la tecnología suele aislar a las personas. Las aplicaciones modernas tienden a **maximizar la atención** del usuario en pantallas, relegando el contacto social directo.  
Frente a eso, Vivid propone un cambio de enfoque: usar la tecnología **para acercar a las personas, no para distanciarlas**.

El problema que abordamos es la **desconexión entre los habitantes de una misma comunidad** y la falta de visibilidad de eventos locales que muchas veces pasan desapercibidos.  
Nuestro desafío fue diseñar un sistema que:

- Permita **difundir actividades comunitarias locales** de forma simple y accesible.  
- Ofrezca a los usuarios una **experiencia fluida** para descubrir eventos cercanos a su ubicación.  
- Incentive la **participación presencial**, no solo el consumo digital.

---

## Arquitectura y Estructura General

El proyecto fue desarrollado con **Django (Python)** en el backend y **HTML/CSS/JavaScript** en el frontend, utilizando **MapLibre GL JS** para el componente de geolocalización.  
El sistema está dividido modularmente en aplicaciones internas, siguiendo las buenas prácticas de Django:

```
/apps
 ├── events/      # Gestión completa de eventos (CRUD, filtros, suscripciones, calendario), Mapa interactivo, geocodificación inversa y sincronización con la interfaz.
 ├── users/       # Autenticación, perfiles y gestión de eventos personales

```

Los archivos estáticos (CSS, JS, imágenes) se organizan por componente, garantizando **coherencia visual** y **reutilización** entre vistas.  
Se aplicó un enfoque de **diseño modular y escalable**, priorizando la separación lógica de responsabilidades entre frontend, backend y persistencia de datos.

### 🔧 Actualizaciones del Sprint 2 en la arquitectura

Durante el Sprint 2 se añadió:

- **Integración completa de MapLibre GL JS**:
  - Marcadores dinámicos sincronizados con la lista de eventos.
  - FlyTo y resaltado temporal al seleccionar un evento.
  - Mapa dedicado en la vista de detalle.
  - Mapa interactivo en creación con marcador arrastrable.

- **Geocodificación inversa** usando la API de Nominatim para obtener direcciones reales.

- **Optimización del ORM con** `select_related`, `prefetch_related` y `annotate`, reduciendo las consultas N+1.

- **Sincronización completa frontend–backend** para filtros avanzados.
---

## Principales Decisiones de Diseño

### 1. **Elección Tecnológica**
Se optó por **MapLibre GL JS**, una alternativa open-source que permitió mayor control sobre la representación del mapa sin costos asociados.  
En Sprint 2 esta decisión fue validada al permitir:
- Marcadores dinámicos.
- Sincronización con filtros.
- Integración con geocodificación inversa.

### 2. **Estructura del Modelo de Datos**
El modelo fue diseñado para ser **escalable y claro**, compuesto por cinco entidades principales:
- **User:** extiende AbstractUser de Django, con ID personalizado y foto de perfil.
- **Event:** núcleo del sistema, con atributos como `name`, `description`, `date`, `location`, `latitud`, `longitud`, `photo`, `owner`, `category`, `tags` y relación ManyToMany con asistentes.
- **Category:** clasificación temática de los eventos (música, deporte, arte, tecnología, etc.).
- **EventImage:** galería de imágenes adicionales para cada evento, con caption opcional.
- **HasSubs:** tabla intermedia para suscripciones usuario-evento, con timestamp de suscripción y restricción de unicidad.

El diseño implementa relaciones uno-a-muchos y muchos-a-muchos, con **documentación completa en docstrings** siguiendo estándares de Python para facilitar el mantenimiento y escalabilidad.

Durante Sprint 2 se consolidó el diseño al validar:
- `HasSubs` como tabla intermedia con restricción de unicidad.
- Comportamiento correcto de `CASCADE` y `SET_NULL`.
- Uso de `DecimalField` para latitud/longitud con precisión suficiente para geolocalización.
- Inclusión de propiedades auxiliares sin modificar estructura.

### 3. **Diseño UI/UX**
Se definió una línea visual coherente y moderna, inspirada en tonos cálidos y contrastes suaves.  
El objetivo fue lograr una interfaz **intuitiva, estética y funcional**, priorizando la exploración visual.  
Entre las decisiones clave:

- **Mapa y lista lateral** como elementos centrales de navegación.  
- **Cards visuales** para cada evento, con imagen, descripción, categoría y botón “Asistir”.  
- **Formularios simples** y retroalimentación visual clara.  
- **Diseño responsivo**, adaptado para dispositivos móviles y escritorio.  

Los estilos se organizaron en módulos (`base.css`, `navbar.css`, `event_card.css`, etc.) con **variables CSS globales**, garantizando consistencia en colores y tipografía.

Sprint 2 añadió:
- **Pills interactivas** para filtros activos.
- **Marcadores visualmente personalizados**.
- Migración completa a **íconos SVG**.

### 4. **Interactividad y Usabilidad**
Se integró **JavaScript** para conectar la lista de eventos con el mapa. Cada marcador geográfico se sincroniza con la card correspondiente, permitiendo navegación fluida entre elementos visuales y geográficos.  
Este comportamiento fue central en la validación del concepto durante el Sprint 1.

En Sprint 2 se agregó:
- Sincronización lista → mapa.
- Actualización dinámica de suscripciones.
- Validación visual inmediata de filtros.
---

## ⚙️ Funcionalidades Implementadas

| Funcionalidad | Estado | Descripción |
|----------------|---------|-------------|
| **Vista Home (Lista de Eventos)** | ✅ Completa | Lista dinámica con filtros avanzados (búsqueda, categoría, recientes, populares, cercanos) + mapa interactivo con marcadores. |
| **Vista Create** | ✅ Completa | Formulario completo con geocodificación automática, suscripción automática del creador y validación. |
| **Vista Detail** | ✅ Completa | Página individual con toda la info del evento, galería de imágenes, mapa, contador de asistentes y botones de suscripción. |
| **Vista Calendar** | ✅ Completa | Calendario interactivo que muestra eventos suscritos del usuario, agrupados por mes. |
| **Vista Mis Eventos** | ✅ Completa | Panel personal con eventos creados y suscritos, separando roles de organizador y asistente. |
| **Vista About** | ✅ Completa | Página informativa sobre el proyecto y el equipo. |
| **Sistema de Suscripciones** | ✅ Completa | Subscribe/Unsubscribe con respuestas AJAX, validación de duplicados y actualización en tiempo real. |
| **Autenticación de Usuarios** | ✅ Completa | Sistema completo con django-allauth: registro, login, logout y protección de rutas. |
| **Modelo de Datos** | ✅ Completa | 5 modelos documentados: User, Event, Category, EventImage, HasSubs con relaciones completas. |
| **Filtros Dinámicos** | ✅ Completa | Sistema AJAX para filtrar eventos por texto, categoría, fecha, popularidad y distancia geográfica. |
| **Geocodificación** | ✅ Completa | Conversión automática de direcciones a coordenadas usando API de Nominatim. |
| **Documentación de Código** | ✅ Completa | Docstrings detallados en models.py y views.py de events y users siguiendo estándares Python. |



### ✔️ Funcionalidades del Sprint 1 (base)
- Vista principal con mapa básico y lista de eventos.
- Modelo de datos inicial y CRUD esencial.
- Plantillas base y primeros estilos.
- Sistema de creación de eventos sin geolocalización avanzada.

---

## ✔️ Funcionalidades del Sprint 2 (nuevas)

### 🗺️ Mapa Interactivo Avanzado
- Marcadores dinámicos desde base de datos.
- FlyTo al seleccionar evento.
- Resaltado temporal del marcador activo.
- Sincronización de visibilidad según filtros aplicados.
- Pop-up de ubicación actual del usuario.

### 🔎 Sistema de Filtrado Completo
- Búsqueda por texto libre (título, descripción, ubicación, tags).
- Filtrado múltiple por categorías.
- Ordenamiento:
  - Por cercanía geográfica (usando la API de Geolocalización del navegador).
  - Por fecha próxima.
  - Por popularidad (cantidad de suscripciones).
- Pills visuales removibles.

### 📍 Creación de Eventos con Geolocalización
- Mapa con marcador arrastrable.
- Captura automática de coordenadas.
- Geocodificación inversa (Nominatim).
- Validación de ubicación.
- Redirección automática a la vista de detalle tras crear.

### ⭐ Sistema Completo de Suscripciones
- Subscribe / Unsubscribe con actualización instantánea.
- Bloqueo de suscripciones duplicadas.
- Contador dinámico de asistentes.

### 🧾 Vista de Detalle (extendida)
- Mapa dedicado.
- Sección mejorada con datos completos y tags.
- Botones de interacción mejorados.

### 🧑‍💻 Vista “Mis Eventos”
- Eventos creados por el usuario.
- Eventos suscritos.
- Posibilidad de editar o eliminar propios eventos.

### 📅 Vista Calendario
- Vista mensual navegable.
- Eventos creados y suscritos del usuario.
- Navegación directa a la vista del evento.

### 🔐 Autenticación y Seguridad
- Protección de rutas como creación y gestión.
- Persistencia de sesión.

### 🧪 QA y Mantenimiento
- Pruebas completas de flujos centrales.
- Corrección de bugs.
- Limpieza y documentación final.

---

## Aprendizajes y Decisiones Organizacionales

Durante este primer sprint, el equipo enfrentó desafíos propios del trabajo colaborativo en ingeniería de software:

### Problemas Detectados
- **Tareas amplias y mal definidas** en el backlog inicial, dificultando la planificación efectiva.  
- **Falta de comunicación formal** y de responsables explícitos por tarea.  
- **Reuniones poco eficientes** y descoordinación temporal entre miembros.

### Acciones Correctivas
- Subdivisión de tareas en **bloques de 2–3 horas** con responsables definidos.  
- Establecimiento de **Telegram** como canal oficial de comunicación.  
- Nombramiento de un **Scrum Master** responsable del seguimiento y cumplimiento del backlog.  
- Reuniones semanales más breves y estructuradas, enfocadas en decisiones y bloqueos.  


Durante el Sprint 2 el equipo fortaleció su trabajo colaborativo:

### ✔️ Mejoras incorporadas
- Tareas más pequeñas (2–3 horas) para seguimiento eficiente.
- Coordinación activa mediante Telegram.
- Revisión de código entre pares.
- Prioridad estratégica en completar todas las funcionalidades core.

### ✔️ Desafíos superados
- Manejo de permisos de la API de Geolocalización.
- Problemas cross-browser en el filtrado geográfico.
- Sincronización frontend–backend en suscripciones.
- Rate limiting de Nominatim.

---

---

## Conclusión

El desarrollo de **Vivid** ha evolucionado exitosamente desde su concepción inicial hasta convertirse en una **plataforma funcional y completa** para la gestión de eventos geolocalizados. El proyecto logró implementar todas las funcionalidades core planificadas:

✅ **Sistema completo de autenticación y perfiles**  
✅ **CRUD completo de eventos con geocodificación automática**  
✅ **Sistema robusto de suscripciones con validaciones**  
✅ **Filtros avanzados y búsqueda dinámica**  
✅ **Calendario interactivo personalizado**  
✅ **Integración fluida entre mapa y lista de eventos**  
✅ **Código completamente documentado y mantenible**

Más allá de la implementación técnica, este proyecto representó un **proceso de aprendizaje continuo** en ingeniería de software, donde el equipo desarrolló competencias en:
- Trabajo colaborativo con Git y metodologías ágiles
- Diseño de arquitecturas escalables con Django
- Desarrollo full-stack con integración de APIs externas
- Documentación profesional de código
- Resolución de problemas técnicos complejos

**Vivid** cumple su misión original: **usar la tecnología para acercar personas**, proporcionando una herramienta real que fortalece la vida comunitaria y promueve experiencias presenciales significativas. El proyecto está listo para ser desplegado y continuar evolucionando según las necesidades de sus usuarios.

---

## Tecnologías Principales

- **Backend:** Django 5.2.8 (Python 3.x)
- **Autenticación:** django-allauth 65.13.1
- **Frontend:** HTML5, CSS3 (modular con variables globales), JavaScript (ES6+)
- **Mapa:** MapLibre GL JS + OpenFreeMap
- **Geocodificación:** Nominatim API (OpenStreetMap)
- **Base de Datos:** SQLite3 (desarrollo) / PostgreSQL (producción recomendada)
- **Imágenes:** Pillow 12.0.0
- **Control de Versiones:** Git / GitHub
- **Diseño de Mockups:** Canva
- **Entorno de desarrollo:** Virtualenv / venv + Django Admin

