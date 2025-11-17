#!/usr/bin/env python
"""
Script para crear datos de prueba usando Django ORM directamente
Ejecutar: python seed.py
"""

import os
import django
from django.utils import timezone
from datetime import timedelta

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vivid.settings')
django.setup()

# Importar modelos DESPUÉS de django.setup()
from django.contrib.auth import get_user_model
from apps.events.models import Event, Category, HasSubs

User = get_user_model()

def crear_usuario():
    """Crear usuario de prueba"""
    try:
        user, created = User.objects.get_or_create(
            username='testuser',
            defaults={'email': 'test@example.com'}
        )
        if created:
            user.set_password('test123')
            user.save()
            print(f"✅ Usuario creado: {user.username}")
        else:
            print(f"ℹ️ Usuario ya existe: {user.username}")
        return user
    except Exception as e:
        print(f"❌ Error al crear usuario: {e}")
        return None

def crear_categorias():
    """Crear categorías"""
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
        try:
            cat, created = Category.objects.get_or_create(category=cat_name)
            categorias.append(cat)
            if created:
                print(f"✅ Categoría creada: {cat_name}")
            else:
                print(f"ℹ️ Categoría ya existe: {cat_name}")
        except Exception as e:
            print(f"❌ Error creando categoría {cat_name}: {e}")
    
    return categorias

def crear_eventos(user, categorias):
    """Crear eventos de prueba"""
    eventos_data = [
        # Música
        {
            "name": "Concierto de Rock",
            "description": "Un increíble concierto de rock en vivo con las mejores bandas del país",
            "location": "Santiago, Chile",
            "latitud": -33.8688,
            "longitud": -51.5304,
            "date": timezone.now() + timedelta(days=7),
            "category": categorias[0] if len(categorias) > 0 else None,
        },
        {
            "name": "Festival de Jazz",
            "description": "Festival internacional de jazz con artistas destacados",
            "location": "Centro Cultural Gabriela Mistral, Santiago",
            "latitud": -33.4372,
            "longitud": -70.6373,
            "date": timezone.now() + timedelta(days=14),
            "category": categorias[0] if len(categorias) > 0 else None,
        },
        {
            "name": "Concierto Acústico",
            "description": "Noche de música acústica e íntima",
            "location": "Peña de los Parra, Santiago",
            "latitud": -33.4305,
            "longitud": -70.6245,
            "date": timezone.now() + timedelta(days=21),
            "category": categorias[0] if len(categorias) > 0 else None,
        },
        # Deporte
        {
            "name": "Partido de Fútbol",
            "description": "Partido amistoso de fútbol entre equipos locales",
            "location": "Estadio Nacional, Santiago",
            "latitud": -33.4489,
            "longitud": -70.6693,
            "date": timezone.now() + timedelta(days=3),
            "category": categorias[1] if len(categorias) > 1 else None,
        },
        {
            "name": "Torneo de Tenis",
            "description": "Torneo abierto de tenis con categorías amateur y profesional",
            "location": "Club de Tenis Las Condes, Santiago",
            "latitud": -33.3882,
            "longitud": -70.5611,
            "date": timezone.now() + timedelta(days=10),
            "category": categorias[1] if len(categorias) > 1 else None,
        },
        {
            "name": "Maratón de Santiago",
            "description": "Maratón anual de Santiago, 42km por las calles de la ciudad",
            "location": "Parque O'Higgins, Santiago",
            "latitud": -33.4389,
            "longitud": -70.7363,
            "date": timezone.now() + timedelta(days=28),
            "category": categorias[1] if len(categorias) > 1 else None,
        },
        {
            "name": "Clase de Yoga",
            "description": "Sesión de yoga al aire libre en el parque",
            "location": "Parque Metropolitano, Santiago",
            "latitud": -33.4256,
            "longitud": -70.5593,
            "date": timezone.now() + timedelta(days=5),
            "category": categorias[1] if len(categorias) > 1 else None,
        },
        # Arte
        {
            "name": "Exposición de Arte",
            "description": "Exposición de arte contemporáneo con obras de artistas nacionales",
            "location": "Galería MAC, Santiago",
            "latitud": -33.4372,
            "longitud": -70.6173,
            "date": timezone.now() + timedelta(days=10),
            "category": categorias[2] if len(categorias) > 2 else None,
        },
        {
            "name": "Taller de Pintura",
            "description": "Taller práctico de técnicas de pintura para principiantes",
            "location": "Estudio Arte Vivo, Santiago",
            "latitud": -33.4300,
            "longitud": -70.6100,
            "date": timezone.now() + timedelta(days=8),
            "category": categorias[2] if len(categorias) > 2 else None,
        },
        {
            "name": "Exhibición de Fotografía",
            "description": "Muestra de fotografía urbana contemporánea",
            "location": "Galería Praxis, Santiago",
            "latitud": -33.4250,
            "longitud": -70.6250,
            "date": timezone.now() + timedelta(days=18),
            "category": categorias[2] if len(categorias) > 2 else None,
        },
        # Tecnología
        {
            "name": "Hackathon 2025",
            "description": "Compite y gana premios en nuestro hackathon de 24 horas",
            "location": "Centro de Innovación, Santiago",
            "latitud": -33.4409,
            "longitud": -70.6693,
            "date": timezone.now() + timedelta(days=15),
            "category": categorias[3] if len(categorias) > 3 else None,
        },
        {
            "name": "Conferencia de Python",
            "description": "Conferencia sobre desarrollo en Python con expertos internacionales",
            "location": "Universidad de Chile, Santiago",
            "latitud": -33.4569,
            "longitud": -70.6670,
            "date": timezone.now() + timedelta(days=12),
            "category": categorias[3] if len(categorias) > 3 else None,
        },
        {
            "name": "Workshop de React",
            "description": "Taller intensivo de React para desarrollo web moderno",
            "location": "Startup Chile, Santiago",
            "latitud": -33.4226,
            "longitud": -70.6054,
            "date": timezone.now() + timedelta(days=20),
            "category": categorias[3] if len(categorias) > 3 else None,
        },
        # Gastronomía
        {
            "name": "Festival Gastronómico",
            "description": "Festival de comida callejera y restaurantes locales",
            "location": "Bellavista, Santiago",
            "latitud": -33.4361,
            "longitud": -70.6005,
            "date": timezone.now() + timedelta(days=11),
            "category": categorias[4] if len(categorias) > 4 else None,
        },
        {
            "name": "Cata de Vinos",
            "description": "Experiencia de cata de vinos premium del Valle del Maipo",
            "location": "Viña Santa Rita, Maipo",
            "latitud": -33.7485,
            "longitud": -70.6900,
            "date": timezone.now() + timedelta(days=9),
            "category": categorias[4] if len(categorias) > 4 else None,
        },
        {
            "name": "Masterclass de Cocina",
            "description": "Masterclass con chef renombrado sobre cocina francesa",
            "location": "Escuela de Cocina Lúcida, Santiago",
            "latitud": -33.4200,
            "longitud": -70.6150,
            "date": timezone.now() + timedelta(days=17),
            "category": categorias[4] if len(categorias) > 4 else None,
        },
        # Educación
        {
            "name": "Charla sobre Emprendimiento",
            "description": "Charla inspiradora sobre emprendimiento y negocios digitales",
            "location": "Instituto Profesional DuocUC, Santiago",
            "latitud": -33.4580,
            "longitud": -70.5732,
            "date": timezone.now() + timedelta(days=6),
            "category": categorias[5] if len(categorias) > 5 else None,
        },
        {
            "name": "Seminario de Marketing Digital",
            "description": "Seminario completo sobre estrategias de marketing en redes sociales",
            "location": "Universidad Diego Portales, Santiago",
            "latitud": -33.4375,
            "longitud": -70.6650,
            "date": timezone.now() + timedelta(days=13),
            "category": categorias[5] if len(categorias) > 5 else None,
        },
        # Naturaleza
        {
            "name": "Excursión a La Campana",
            "description": "Senderismo a la cumbre del Cerro La Campana en Valparaíso",
            "location": "Parque Nacional La Campana",
            "latitud": -32.8833,
            "longitud": -71.4333,
            "date": timezone.now() + timedelta(days=22),
            "category": categorias[6] if len(categorias) > 6 else None,
        },
        {
            "name": "Observación de Aves",
            "description": "Tour de avistamiento de aves en humedal de Batuco",
            "location": "Humedal de Batuco, norte de Santiago",
            "latitud": -33.2885,
            "longitud": -70.6333,
            "date": timezone.now() + timedelta(days=16),
            "category": categorias[6] if len(categorias) > 6 else None,
        },
        {
            "name": "Picnic Ecológico",
            "description": "Encuentro ambiental en plena naturaleza con actividades eco-friendly",
            "location": "Reserva Natural Río Clarillo, Santiago",
            "latitud": -33.6167,
            "longitud": -70.5667,
            "date": timezone.now() + timedelta(days=24),
            "category": categorias[6] if len(categorias) > 6 else None,
        },
    ]
    
    for ev_data in eventos_data:
        try:
            event, created = Event.objects.get_or_create(
                name=ev_data["name"],
                defaults={
                    "description": ev_data["description"],
                    "location": ev_data["location"],
                    "latitud": ev_data["latitud"],
                    "longitud": ev_data["longitud"],
                    "date": ev_data["date"],
                    "category": ev_data["category"],
                    "owner": user,
                }
            )
            if created:
                print(f"✅ Evento creado: {event.name}")
            else:
                print(f"ℹ️ Evento ya existe: {event.name}")
        except Exception as e:
            print(f"❌ Error al crear evento '{ev_data['name']}': {e}")

def main():
    """Función principal"""
    print("🚀 Iniciando creación de datos de prueba...\n")
    
    user = crear_usuario()
    print()
    categorias = crear_categorias()
    print()
    if user and categorias:
        crear_eventos(user, categorias)
    
    print("\n✨ Datos de prueba creados exitosamente!")

if __name__ == '__main__':
    main()
