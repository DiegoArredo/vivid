from django.db import models
from django.utils import timezone

# from categorias.models import Category

from django.contrib.auth.models import AbstractUser


# Create your models here.
class User(AbstractUser):
    username = models.CharField(max_length=30)


class Events(models.Model):
    name = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    created = models.DateField(default=timezone.now().strftime("%Y-%m-%d"))
    date = models.DateField(blank=True)
    # category = models.ForeignKey(Category, default="general", on_delete=models.CASCADE)  # la llave foránea
    owner = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
