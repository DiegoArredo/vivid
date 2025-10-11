from django import forms
from .models import Event, Category

class EventForm(forms.ModelForm):
    class Meta:
        model = Event
        fields = ['name', 'description', 'date', 'location', 'category', 'tags']
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
            'tags': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Ej: música concierto rock'
            })
        }