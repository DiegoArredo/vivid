"""
Script para crear datos de prueba para Vivid Events
Ejecutar en Django shell: python manage.py shell < create_test_data.py
"""

from django.contrib.auth import get_user_model
from apps.events.models import Event, Category, HasSubs
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()

print("🚀 Iniciando creación de datos de prueba...")

# Crear usuario si no existe
try:
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(
            username='admin',
            email='admin@vivid.com',
            password='admin123'
        )
        print("✅ Usuario admin creado")
    else:
        print(f"✅ Usando usuario existente: {user.username}")
except Exception as e:
    print(f"❌ Error creando usuario: {e}")
    exit(1)

# Crear categorías
categorias_data = [
    "Música",
    "Deporte",
    "Arte",
    "Tecnología",
    "Gastronomía",
    "Educación",
    "Naturaleza"
]

categorias = []
for cat_name in categorias_data:
    cat, created = Category.objects.get_or_create(category=cat_name)
    categorias.append(cat)
    if created:
        print(f"✅ Categoría creada: {cat_name}")
    else:
        print(f"ℹ️  Categoría ya existía: {cat_name}")

# Datos de eventos de ejemplo
eventos_data = [
    {
        "name": "Festival de Música Rock",
        "description": "El festival más grande de rock de la temporada con bandas nacionales e internacionales.",
        "days_from_now": 10,
        "location": "Estadio Nacional, Santiago",
        "latitud": -33.4654,
        "longitud": -70.6106,
        "category": "Música",
        "tags": "rock festival música concierto"
    },
    {
        "name": "Maratón de Santiago",
        "description": "42K por las principales calles de Santiago. Inscripciones abiertas.",
        "days_from_now": 30,
        "location": "Parque O'Higgins",
        "latitud": -33.4618,
        "longitud": -70.6560,
        "category": "Deporte",
        "tags": "running deporte maratón fitness"
    },
    {
        "name": "Exposición de Arte Contemporáneo",
        "description": "Muestra de artistas locales emergentes en el Museo de Bellas Artes.",
        "days_from_now": 5,
        "location": "Museo de Bellas Artes",
        "latitud": -33.4353,
        "longitud": -70.6408,
        "category": "Arte",
        "tags": "arte museo exposición cultura"
    },
    {
        "name": "Hackathon Tech Summit 2025",
        "description": "48 horas de programación intensiva. Premios para los mejores proyectos.",
        "days_from_now": 15,
        "location": "Centro de Innovación UC",
        "latitud": -33.4977,
        "longitud": -70.6133,
        "category": "Tecnología",
        "tags": "programación hackathon tecnología innovación"
    },
    {
        "name": "Festival Gastronómico",
        "description": "Los mejores chefs de la ciudad se reúnen en un solo lugar.",
        "days_from_now": 7,
        "location": "Parque Bicentenario",
        "latitud": -33.4115,
        "longitud": -70.5736,
        "category": "Gastronomía",
        "tags": "comida gastronomía chef festival"
    },
    {
        "name": "Charla: Inteligencia Artificial",
        "description": "Expertos internacionales hablan sobre el futuro de la IA.",
        "days_from_now": 3,
        "location": "Universidad de Chile",
        "latitud": -33.4573,
        "longitud": -70.6641,
        "category": "Educación",
        "tags": "educación tecnología AI charla"
    },
    {
        "name": "Trekking Cerro Manquehue",
        "description": "Caminata guiada al atardecer con vista panorámica de Santiago.",
        "days_from_now": 2,
        "location": "Cerro Manquehue",
        "latitud": -33.3582,
        "longitud": -70.5262,
        "category": "Naturaleza",
        "tags": "trekking naturaleza outdoor deportes"
    },
    {
        "name": "Concierto de Jazz",
        "description": "Noche de jazz con músicos locales e internacionales.",
        "days_from_now": 12,
        "location": "Teatro Municipal",
        "latitud": -33.4378,
        "longitud": -70.6506,
        "category": "Música",
        "tags": "jazz música concierto cultural"
    },
    {
        "name": "Torneo de Fútbol Amateur",
        "description": "Campeonato local de fútbol. Inscribe a tu equipo.",
        "days_from_now": 20,
        "location": "Complejo Deportivo Estadio Italiano",
        "latitud": -33.4296,
        "longitud": -70.6154,
        "category": "Deporte",
        "tags": "fútbol deporte torneo amateur"
    },
    {
        "name": "Feria de Diseño",
        "description": "Diseñadores independientes exhiben sus creaciones.",
        "days_from_now": 8,
        "location": "Centro Cultural GAM",
        "latitud": -33.4382,
        "longitud": -70.6369,
        "category": "Arte",
        "tags": "diseño arte feria emprendimiento"
    },
]

# Crear eventos
eventos_creados = []
for evento_data in eventos_data:
    # Buscar la categoría
    categoria = next((c for c in categorias if c.category == evento_data["category"]), None)
    
    # Crear el evento
    evento, created = Event.objects.get_or_create(
        name=evento_data["name"],
        defaults={
            "description": evento_data["description"],
            "date": timezone.now() + timedelta(days=evento_data["days_from_now"]),
            "location": evento_data["location"],
            "latitud": evento_data["latitud"],
            "longitud": evento_data["longitud"],
            "category": categoria,
            "owner": user,
            "tags": evento_data["tags"]
        }
    )
    
    if created:
        eventos_creados.append(evento)
        print(f"✅ Evento creado: {evento.name}")
    else:
        print(f"ℹ️  Evento ya existía: {evento.name}")

# Crear algunos usuarios adicionales para simular asistentes
print("\n👥 Creando usuarios adicionales...")
nombres = ["Juan", "María", "Pedro", "Ana", "Carlos", "Laura"]
usuarios_adicionales = []

for nombre in nombres:
    username = f"{nombre.lower()}_test"
    usuario, created = User.objects.get_or_create(
        username=username,
        defaults={
            "email": f"{username}@test.com",
        }
    )
    if created:
        usuario.set_password("test123")
        usuario.save()
    usuarios_adicionales.append(usuario)
    print(f"✅ Usuario: {username}")

# Asignar asistentes aleatorios a eventos (para probar filtro de popularidad)
print("\n🎯 Asignando asistentes a eventos...")
for evento in eventos_creados[:5]:  # Solo primeros 5 eventos
    num_asistentes = random.randint(2, len(usuarios_adicionales))
    asistentes = random.sample(usuarios_adicionales, num_asistentes)
    
    for asistente in asistentes:
        HasSubs.objects.get_or_create(
            username=asistente,
            name=evento
        )
    
    print(f"✅ {num_asistentes} asistentes agregados a: {evento.name}")

print("\n" + "="*60)
print("🎉 ¡Datos de prueba creados exitosamente!")
print("="*60)
print(f"\n📊 Resumen:")
print(f"   - Categorías: {Category.objects.count()}")
print(f"   - Eventos: {Event.objects.count()}")
print(f"   - Usuarios: {User.objects.count()}")
print(f"   - Suscripciones: {HasSubs.objects.count()}")

print("\n💡 Ahora puedes probar:")
print("   1. Filtro 'Todo': Ver todos los eventos")
print("   2. Filtro 'Más Recientes': Ordenados por fecha")
print("   3. Filtro 'Populares': Ordenados por asistentes")
print("   4. Filtro 'Más Cercanos': Necesitas permitir ubicación en el navegador")
print("   5. Búsqueda: Escribe 'música' o 'deporte'")
print("   6. Categorías: Filtra por cualquier categoría")

print("\n🔐 Usuario admin creado:")
print("   Username: admin")
print("   Password: admin123")
