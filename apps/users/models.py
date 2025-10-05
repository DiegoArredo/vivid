from django.db import models
from django.utils import timezone

from django.contrib.auth.models import AbstractUser


# Create your models here.
class User(AbstractUser):
    user_id = models.BigAutoField(primary_key=True)
    photo = models.ImageField(upload_to="profile_pics/", blank=True, null=True)
    # username = models.CharField(max_length=30)

