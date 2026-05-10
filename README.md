# 🚀 Vivid — Planificador de Eventos Geolocalizados

> **Contexto:** Proyecto final para el curso de Ingeniería de Software (CC4401) en la Universidad de Chile. Desarrollado en equipo bajo metodologías ágiles durante el semestre de Primavera 2025.
> **Equipo:** Lucplsciano Aguilar, **Diego Arredondo**, Pablo Reyes, Matías Saavedra.

---

## 🎯 Descripción General

**Vivid** es una aplicación web full-stack basada en geolocalización, diseñada para combatir el aislamiento digital conectando a las personas con eventos presenciales en su comunidad. A través de un mapa interactivo y un sistema dinámico de filtros, los usuarios pueden descubrir, publicar y suscribirse a actividades locales (conciertos, ferias, deportes) en tiempo real.

![Demo principal de Vivid](docs/Vivid.gif)

---

## 🚀 Instalación Rápida

Para ejecutar **Vivid** en tu entorno local, asegúrate de tener Python instalado y ejecuta los siguientes comandos en tu terminal:

```bash
# 1. Clonar el repositorio y entrar a la carpeta
git clone https://github.com/DiegoArredo/vivid.git
cd vivid

# 2. Crear y activar un entorno virtual
python3 -m venv venv
source venv/bin/activate 
#or source venv/Scripts/activate

# 3. Instalar dependencias del proyecto
pip install -r requirements.txt

# 4. Aplicar migraciones de la base de datos
python manage.py migrate

# 5. (Opcional) Crear superusuario para acceso al panel admin
python manage.py createsuperuser

# 6. Levantar el servidor de desarrollo
python manage.py runserver

```


## 👨‍💻 Mi Rol y Contribuciones Principales

Como desarrollador Full-Stack en este proyecto, me enfoqué en la implementación del sistema de usuarios, la interactividad asíncrona y la calidad del código. Mis aportes principales incluyen:

*   **Sistema de Suscripciones Asíncrono (AJAX):** Desarrollé el flujo completo para que los usuarios se suscriban o desuscriban de los eventos. Implementé los endpoints (métodos POST), actualicé los contadores de asistentes en tiempo real y gestioné la manipulación del DOM mediante JavaScript y AJAX, logrando una experiencia fluida sin necesidad de recargar la página.
*   **Gestión de Autenticación (`django-allauth`):** Lideré la migración del sistema de registro y login básico hacia la librería `django-allauth` para lograr una gestión de sesiones robusta y segura. Integré y personalicé las plantillas (templates), formularios y configuración de URLs de la librería para adaptarlas al diseño de la aplicación.
*   **Geolocalización y Filtros por Proximidad:** Implementé la lógica y las vistas necesarias para el filtrado de eventos cercanos, calculando distancias basándome en la ubicación del usuario y mostrando la distancia exacta en las tarjetas (cards) de cada evento, incluyendo la gestión de errores de geolocalización.
*   **Panel Personal de Usuario ("Mis Eventos"):** Fui responsable del diseño y la lógica backend de la vista personalizada del dashboard del usuario, permitiéndoles visualizar y diferenciar claramente los eventos que han creado frente a los eventos a los que están suscritos.
*   **Limpieza y Calidad de Código (Refactoring):** Llevé a cabo refactorizaciones significativas para eliminar deuda técnica: eliminé vistas, aplicaciones (`dashboard`) y rutas obsoletas, centralicé el manejo de notificaciones flash en componentes CSS independientes y redacté la documentación completa (Docstrings) para los modelos de datos y las vistas en el backend.


*   **Gestión Ágil:** Actué como *Scrum Master* durante el Sprint 2, dividiendo tareas técnicas complejas en bloques de 2-3 horas y liderando las revisiones de código (Code Reviews) del equipo.

---

## ⚙️ Arquitectura y Stack Tecnológico

El proyecto sigue una arquitectura monolítica modular, separando claramente la lógica de negocio (`users`, `events`), la persistencia de datos y la interfaz de usuario.

*   **Backend:** Django 5.2.8 (Python)
*   **Frontend:** HTML5, CSS3 (Variables globales, diseño responsivo), Vanilla JS (ES6+).
*   **Base de Datos:** SQLite3 (Desarrollo) con migración preparada para PostgreSQL.
*   **Mapas y Geolocalización:** MapLibre GL JS + OpenFreeMap + Nominatim API.
*   **Autenticación:** `django-allauth` (Gestión completa de sesiones y seguridad de rutas).

---

## 🛠️ Retos Técnicos Superados

1.  **Sincronización Frontend-Backend (Estado Dinámico):** Un desafío crítico fue mantener el mapa y la lista de eventos sincronizados sin recargar la página. Se resolvió integrando peticiones asíncronas (AJAX) que actualizan el DOM y los marcadores de MapLibre en tiempo real según los filtros activos (distancia, categoría, fecha).
2.  **Optimización de Consultas Geográficas:** Para el filtrado de eventos por cercanía, se integró la API de Geolocalización del navegador, pasando las coordenadas al backend de Django para filtrar y ordenar los querysets eficientemente.
3.  **Manejo de Suscripciones Simultáneas:** Se implementó una tabla intermedia (`HasSubs`) con restricciones de unicidad y respuestas asíncronas para evitar suscripciones duplicadas y actualizar el contador de asistentes instantáneamente.

---

## 🤝 Dinámica de Equipo y Metodología (Agile)

El desarrollo se dividió en Sprints, enfrentando desafíos reales de ingeniería de software colaborativa:

*   **Evolución del Flujo de Trabajo:** Pasamos de un backlog ambiguo en el Sprint 1 a un sistema altamente estructurado en el Sprint 2. Implementamos **tareas granulares**, asignación de responsables directos y un canal oficial para resolución de bloqueos.
*   **Integración Continua:** Se estableció una política estricta de trabajo en ramas (features) y Pull Requests, asegurando que el código en `main` siempre fuera estable y estuviera documentado (docstrings bajo estándares de Python).

---

## 📸 Galería y Funcionalidades Core

*   **Mapa Interactivo:** FlyTo animado al seleccionar eventos, pop-up de ubicación del usuario y marcadores arrastrables.
*   **Buscador Multicriterio:** Filtros por texto libre, categorías (pills interactivas) y ordenamiento por proximidad o popularidad.
*   **Panel "Mis Eventos" y Calendario:** Dashboard personalizado para gestionar eventos creados y monitorear la asistencia a eventos suscritos mediante una vista mensual.