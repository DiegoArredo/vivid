from django import forms
from django.contrib.auth.models import User
from django.contrib.auth.forms import UserCreationForm


class LoginForm(forms.Form):
    """Formulario de inicio de sesión"""
    username = forms.CharField(
        max_length=150,
        widget=forms.TextInput(attrs={
            'class': 'auth-input',
            'placeholder': 'Tu nombre de usuario',
            'id': 'id_username'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'auth-input',
            'placeholder': '••••••••',
            'id': 'id_password'
        })
    )


class RegisterForm(UserCreationForm):
    """Formulario de registro de nuevos usuarios"""
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'auth-input',
            'placeholder': 'tu@email.com',
            'id': 'id_email'
        })
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'auth-input',
                'placeholder': 'Elige un nombre de usuario',
                'id': 'id_username'
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Aplicar clase CSS a los campos de contraseña
        self.fields['password1'].widget.attrs.update({
            'class': 'auth-input',
            'placeholder': 'Elige una contraseña segura',
            'id': 'id_password1'
        })
        self.fields['password2'].widget.attrs.update({
            'class': 'auth-input',
            'placeholder': 'Repite tu contraseña',
            'id': 'id_password2'
        })

    def clean_email(self):
        """Validar que el email no esté en uso"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('Este email ya está registrado.')
        return email
