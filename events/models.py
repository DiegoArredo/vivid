from django.db import models
from django.utils import timezone

from django.contrib.auth.models import AbstractUser


# Create your models here.
class User(AbstractUser):
    user_id = models.BigAutoField(primary_key=True)
    photo = models.ImageField(upload_to="profile_pics/", blank=True, null=True)
    # username = models.CharField(max_length=30)


class Event(models.Model):
    name = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    created = models.DateField(default=timezone.now().strftime("%Y-%m-%d"))
    date = models.DateField(blank=True)
    category = models.ForeignKey(
        "Category", default="general", on_delete=models.SET_DEFAULT
    )  # la llave foránea
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.name)


class EventImage(models.Model):
    event = models.ForeignKey(Event, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="event_images/")
    caption = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"Image for {self.event.name}"


class Category(models.Model):
    cat_id = models.BigAutoField(primary_key=True)
    category = models.CharField(max_length=50)


class HasSubs(models.Model):
    username = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.ForeignKey(Event, on_delete=models.CASCADE)
