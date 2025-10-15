# 🚀Vivid — Tu próxima aventura te espera

**Proyecto:** Vivid: Planificador de eventos geolocalizados  
**Curso:** CC4401 - Ingeniería de Software   
**Equipo 2:** Lucciano Aguilar, Diego Arredondo, Pablo Reyes, Matías Saavedra, Nicolás Soto  
**Profesores:** Jocelyn Simmonds  
**Ayudantes:** Jannis Isabel Cruz, Nicolás Grandón  
**Auxiliar:** Joel Riquelme  
**Fecha:** Octubre 2025  

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
 ├── events/      # Gestión de eventos y vistas principales (Home, Create, Detail)
 ├── users/       # Autenticación y perfiles de usuario (pendiente de implementación)
 ├── maps/        # Funcionalidades geográficas y utilidades de mapa
 └── dashboard/   # Panel futuro para administración y métricas (en planificación)
```

Los archivos estáticos (CSS, JS, imágenes) se organizan por componente, garantizando **coherencia visual** y **reutilización** entre vistas.  
Se aplicó un enfoque de **diseño modular y escalable**, priorizando la separación lógica de responsabilidades entre frontend, backend y persistencia de datos.

---

## Principales Decisiones de Diseño

### 1. **Elección Tecnológica**
Inicialmente se evaluó integrar **Google Maps API**, pero se optó por **MapLibre GL JS**, una alternativa **open source** más ligera y libre de costos.  
Esta decisión respondió tanto a consideraciones éticas (tecnología abierta) como prácticas (mayor control sobre el mapa y personalización visual).

### 2. **Estructura del Modelo de Datos**
El modelo fue diseñado para ser **escalable y claro**, compuesto por tres entidades principales:
- **User:** extiende el modelo base de Django y representa a los usuarios/organizadores.
- **Event:** núcleo del sistema, con atributos como `name`, `description`, `date_time`, `location`, `lat`, `lng`, `image`, `owner`.
- **Category:** clasificación temática de los eventos (música, deporte, arte, etc.).

El diseño prioriza relaciones uno-a-muchos y la facilidad de extender funcionalidades futuras, como **suscripciones**, **historial de asistencia** y **recomendaciones personalizadas**.

### 3. **Diseño UI/UX**
Se definió una línea visual coherente y moderna, inspirada en tonos cálidos y contrastes suaves.  
El objetivo fue lograr una interfaz **intuitiva, estética y funcional**, priorizando la exploración visual.  
Entre las decisiones clave:

- **Mapa y lista lateral** como elementos centrales de navegación.  
- **Cards visuales** para cada evento, con imagen, descripción, categoría y botón “Asistir”.  
- **Formularios simples** y retroalimentación visual clara.  
- **Diseño responsivo**, adaptado para dispositivos móviles y escritorio.  

Los estilos se organizaron en módulos (`base.css`, `navbar.css`, `event_card.css`, etc.) con **variables CSS globales**, garantizando consistencia en colores y tipografía.

### 4. **Interactividad y Usabilidad**
Se integró **JavaScript** para conectar la lista de eventos con el mapa. Cada marcador geográfico se sincroniza con la card correspondiente, permitiendo navegación fluida entre elementos visuales y geográficos.  
Este comportamiento fue central en la validación del concepto durante el Sprint 1.

---

## ⚙️ Funcionalidades Implementadas (Sprint 1)

| Funcionalidad | Estado | Descripción |
|----------------|---------|-------------|
| **Vista Home** |  Completa | Lista dinámica de eventos + mapa funcional de Santiago (MapLibre GL JS). |
| **Vista Create** |  Completa | Formulario para crear eventos con nombre, fecha, categoría, imagen y ubicación manual. |
| **Vista Detail** |  Completa | Página individual del evento con galería, descripción, mapa y acción “Asistir”. |
| **Modelo de Datos** |  En Desarrollo | Entidades User, Event, Category, EventImage y HasSubs (en base a Django ORM). |
| **Autenticación / Perfiles** |  Pendiente | Se definió en backlog para Sprint 2. |
| **Subscripciones / Asistencia** |  Pendiente | Se implementará tras autenticación de usuarios. |

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

Estas decisiones permitieron fortalecer la colaboración, evitar retrabajos y alinear las prioridades del equipo.

---

## Próximos Pasos (Sprint 2)

- Implementar autenticación y sistema de perfiles (User/Login/Register).  
- Agregar sistema de suscripciones y asistencia a eventos.  
- Incorporar vistas complementarias (Calendario, Mis Eventos, Dashboard).  
- Mejorar el manejo de coordenadas y la interacción directa entre el mapa y los formularios.  
- Establecer validaciones y pruebas unitarias básicas.  

---

## Conclusión

El desarrollo de **Vivid** durante el Sprint 1 permitió **validar el concepto central del proyecto**: una aplicación capaz de representar dinámicamente la vida social local a través de un mapa interactivo y una interfaz limpia.  
Más allá de la implementación técnica, este sprint fue una **etapa de aprendizaje organizacional**, donde el equipo comprendió la importancia de la planificación granular, la comunicación constante y la visión compartida.

**Vivid** se proyecta como una plataforma con potencial real para **revivir la conexión humana** en la era digital, una herramienta que convierte la tecnología en un puente hacia nuevas experiencias, y no en una barrera.

---

## Tecnologías Principales

- **Backend:** Django 5.1 (Python)
- **Frontend:** HTML5, CSS3 (modular, responsivo), JavaScript
- **Mapa:** MapLibre GL JS + OpenFreeMap
- **Base de Datos:** SQLite3
- **Control de Versiones:** Git / GitHub
- **Diseño de Mockups:** Canva
- **Entorno de desarrollo:** Virtualenv + Django Admin

