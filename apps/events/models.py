from django.db import models
from django.conf import settings
from django.utils import timezone


class Category(models.Model):
    """
    Modelo para representar las categorías de eventos.
    
    Las categorías permiten clasificar los eventos por tipo (ej. Deportes, Música,
    Tecnología, etc.) facilitando la búsqueda y filtrado.
    
    Attributes:
        cat_id (BigAutoField): Identificador único de la categoría.
        category (CharField): Nombre de la categoría (máximo 50 caracteres).
    """
    cat_id = models.BigAutoField(primary_key=True)
    category = models.CharField(max_length=50, verbose_name="Categoría")

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def __str__(self):
        """Representación en string de la categoría."""
        return self.category


class Event(models.Model):
    """
    Modelo principal para representar eventos en la plataforma.
    
    Un evento contiene toda la información necesaria para su publicación y gestión,
    incluyendo detalles básicos, ubicación geográfica, categorización, organizador,
    asistentes suscritos e imágenes.
    
    Attributes:
        name (CharField): Nombre del evento (máximo 250 caracteres).
        description (TextField): Descripción detallada del evento (opcional).
        created (DateField): Fecha de creación del evento en el sistema.
        date (DateTimeField): Fecha y hora en que se realizará el evento.
        location (CharField): Dirección o nombre del lugar del evento (opcional).
        latitud (DecimalField): Coordenada de latitud para visualización en mapa (opcional).
        longitud (DecimalField): Coordenada de longitud para visualización en mapa (opcional).
        category (ForeignKey): Categoría a la que pertenece el evento (opcional).
        owner (ForeignKey): Usuario que creó y organiza el evento.
        attendees (ManyToManyField): Usuarios suscritos al evento (a través de HasSubs).
        photo (ImageField): Imagen principal del evento (opcional).
        tags (CharField): Etiquetas del evento separadas por espacios (opcional).
    
    Related Models:
        - Category: Categoría del evento
        - User: Organizador y asistentes
        - EventImage: Imágenes adicionales del evento
        - HasSubs: Tabla intermedia para suscripciones
    """
    # Información básica
    name = models.CharField(max_length=250, verbose_name="Nombre")
    description = models.TextField(blank=True, verbose_name="Descripción")
    
    # Fechas
    created = models.DateField(default=timezone.now, verbose_name="Creado")
    date = models.DateTimeField(verbose_name="Fecha del evento")
    
    # Ubicación
    location = models.CharField(max_length=300, blank=True, verbose_name="Ubicación")
    latitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        verbose_name="Latitud"
    )
    longitud = models.DecimalField(
        max_digits=9, 
        decimal_places=6, 
        null=True, 
        blank=True,
        verbose_name="Longitud"
    )
    
    # Relaciones
    category = models.ForeignKey(
        Category, 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Categoría"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='eventos_creados',
        verbose_name="Organizador"
    )
    attendees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='HasSubs',
        related_name='eventos_asistiendo',
        blank=True,
        verbose_name="Asistentes"
    )
    
    # Imagen principal
    photo = models.ImageField(
        upload_to='events/', 
        blank=True, 
        null=True,
        verbose_name="Foto principal"
    )
    
    # Tags
    tags = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Tags separados por espacios",
        verbose_name="Etiquetas"
    )

    class Meta:
        ordering = ['-date']
        verbose_name = "Evento"
        verbose_name_plural = "Eventos"

    def __str__(self):
        """Representación en string del evento."""
        return self.name
    
    # Propiedades de compatibilidad con el frontend
    @property
    def titulo(self):
        """
        Alias de 'name' para mantener compatibilidad con código legacy.
        
        Returns:
            str: Nombre del evento.
        """
        return self.name
    
    @property
    def user_organizer(self):
        """
        Alias de 'owner' para mantener compatibilidad con código legacy.
        
        Returns:
            User: Usuario organizador del evento.
        """
        return self.owner


class EventImage(models.Model):
    """
    Modelo para almacenar imágenes adicionales de un evento.
    
    Permite que cada evento tenga múltiples imágenes además de la foto principal,
    útil para mostrar diferentes ángulos, actividades o momentos del evento.
    
    Attributes:
        event (ForeignKey): Evento al que pertenece la imagen.
        image (ImageField): Archivo de imagen almacenado en 'event_images/'.
        caption (CharField): Descripción o pie de foto de la imagen (opcional).
    
    Related Models:
        - Event: Evento al que pertenece esta imagen (relación inversa: 'images')
    """
    event = models.ForeignKey(
        Event, 
        related_name="images", 
        on_delete=models.CASCADE,
        verbose_name="Evento"
    )
    image = models.ImageField(upload_to="event_images/", verbose_name="Imagen")
    caption = models.CharField(max_length=200, blank=True, verbose_name="Descripción")

    class Meta:
        verbose_name = "Imagen de Evento"
        verbose_name_plural = "Imágenes de Eventos"

    def __str__(self):
        """Representación en string de la imagen."""
        return f"Imagen para {self.event.name}"


class HasSubs(models.Model):
    """
    Modelo intermedio para la relación ManyToMany entre usuarios y eventos.
    
    Representa la suscripción de un usuario a un evento, almacenando información
    adicional como la fecha de suscripción. Garantiza que un usuario solo pueda
    suscribirse una vez al mismo evento mediante unique_together.
    
    Attributes:
        username (ForeignKey): Usuario que se suscribe al evento.
        name (ForeignKey): Evento al que se suscribe el usuario.
        subscribed_at (DateTimeField): Fecha y hora de la suscripción (se asigna automáticamente).
    
    Related Models:
        - User: Usuario suscrito
        - Event: Evento al que se suscribe
    
    Constraints:
        - Un usuario solo puede suscribirse una vez al mismo evento (unique_together).
    """
    username = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name="Usuario"
    )
    name = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        verbose_name="Evento"
    )
    subscribed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Fecha de suscripción"
    )

    class Meta:
        unique_together = ('username', 'name')
        verbose_name = "Suscripción"
        verbose_name_plural = "Suscripciones"

    def __str__(self):
        """Representación en string de la suscripción."""
        return f"{self.username.username} -> {self.name.name}"