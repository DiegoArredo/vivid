from django.db import models
from django.utils import timezone

from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Modelo de usuario personalizado que extiende AbstractUser de Django.
    
    Extiende el modelo de usuario predeterminado de Django para agregar funcionalidades
    adicionales específicas de la aplicación, incluyendo un ID personalizado y la
    capacidad de almacenar una foto de perfil.
    
    Hereda todos los campos y métodos de AbstractUser, incluyendo:
    - username: Nombre de usuario único (heredado)
    - email: Correo electrónico (heredado)
    - first_name: Nombre (heredado)
    - last_name: Apellido (heredado)
    - password: Contraseña hasheada (heredado)
    - date_joined: Fecha de registro (heredado)
    
    Attributes:
        user_id (BigAutoField): Identificador único del usuario, usado como clave primaria
                                en lugar del ID por defecto de Django.
        photo (ImageField): Foto de perfil del usuario (opcional). Las imágenes se
                           almacenan en el directorio 'profile_pics/'.
    
    Related Models:
        - Event: Como 'owner' (eventos creados por el usuario) - relación inversa: 'eventos_creados'
        - Event: Como 'attendees' (eventos a los que asiste) - relación inversa: 'eventos_asistiendo'
        - HasSubs: Suscripciones del usuario a eventos
    """
    user_id = models.BigAutoField(primary_key=True)
    photo = models.ImageField(upload_to="profile_pics/", blank=True, null=True)

