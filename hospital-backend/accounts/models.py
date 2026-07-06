from django.db import models

# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = (
        ('admin','Admin'),
        ('pharmacien','Pharmacien'),
        ('magasinier','Magasinier'),
        ('directeur','Directeur'),
    )

    role=models.CharField(
        max_length=20,
        choices=ROLE_CHOICES
    )
