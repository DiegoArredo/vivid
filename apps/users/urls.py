from django.urls import path, include
from . import views

app_name = 'users'

urlpatterns = [
    path('mis-eventos/', views.user_events_view, name='user_events'),

]
