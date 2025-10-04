from django.db import models
from django.utils import timezone

# from categorias.models import Category

from django.contrib.auth.models import AbstractUser


# Create your models here.
class User(AbstractUser):
    user_id = models.BigAutoField(primary_key=True) 
    #username = models.CharField(max_length=30)


class Events(models.Model):
    name = models.CharField(max_length=250)
    description = models.TextField(blank=True)
    created = models.DateField(default=timezone.now().strftime("%Y-%m-%d"))
    date = models.DateField(blank=True)
    category = models.ForeignKey('Category', default="general", on_delete=models.SET_DEFAULT)  # la llave foránea
    owner = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.name)

class Category(models.Model):
    cat_id = models.BigAutoField(primary_key=True)
    category = models.CharField(max_length=50)

class HasSubs(models.Model):
    username = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.ForeignKey(Events, on_delete=models.CASCADE)
