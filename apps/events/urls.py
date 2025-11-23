from django.urls import path
from . import views

app_name = 'events'

urlpatterns = [
    path('', views.event_list, name='event_list'),
    path('crear/', views.event_create, name='event_create'),
    path('evento/<int:event_id>/', views.event_detail, name='event_detail'),
    path('subscribe/', views.subscribe, name='event_subscribe'),
    path('unsubscribe/', views.unsubscribe, name='event_unsubscribe'),
    path('test/', views.test_view, name='test'),
]