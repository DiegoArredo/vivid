from django import forms
from .models import Event, Category

class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ['name', 'description','latitud','longitud','date', 'location', 'category', 'photo', 'tags']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Nombre del evento'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-input',
                'placeholder': 'Describe tu evento...',
                'rows': 4
            }),
            'date': forms.DateTimeInput(attrs={
                'class': 'form-input',
                'type': 'datetime-local'
            }),
            'location': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Dirección del evento'
            }),
            'category': forms.Select(attrs={
                'class': 'form-input'
            }),
            'photo': forms.FileInput(attrs={
                'class': 'form-input',
                'accept': 'image/*'
            }),
            'tags': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Ej: música concierto rock'
            }),
            'latitud': forms.NumberInput(attrs={
                'class': 'form-input','step': '0.000001', 
                'placeholder': '-33.456940'}),
            'longitud': forms.NumberInput(attrs={
                'class': 'form-input','step': '0.000001', 
                'placeholder': '-70.648270'})
        }