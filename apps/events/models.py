from django.db import models
from django.conf import settings
from django.utils import timezone


class Category(models.Model):
    """Modelo de Categoría"""
    cat_id = models.BigAutoField(primary_key=True)
    category = models.CharField(max_length=50, verbose_name="Categoría")

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

    def __str__(self):
        return self.category


class Event(models.Model):
    """Modelo de Evento"""
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
        return self.name
    
    # Alias para compatibilidad con el frontend
    @property
    def titulo(self):
        return self.name
    
    @property
    def user_organizer(self):
        return self.owner


class EventImage(models.Model):
    """Imágenes adicionales de eventos"""
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
        return f"Imagen para {self.event.name}"


class HasSubs(models.Model):
    """Relación de suscripciones a eventos"""
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
        return f"{self.username.username} -> {self.name.name}"