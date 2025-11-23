from allauth.account.forms import SignupForm
from allauth.account.forms import LoginForm as AllAuthLoginForm


class CustomSignupForm(SignupForm):
    """Personaliza el form de signup de django-allauth para aplicar widgets

    Reusa los campos que allauth provee (username, email, password1, password2)
    y aplica los mismos `class` / `placeholder` / `id` que usas en `register.html`.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Aplica atributos CSS/placeholder a todos los campos disponibles
        for name, field in self.fields.items():
            # Mantén cualquier atributo existente y añade los nuestros
            existing = field.widget.attrs or {}
            existing.update({"class": "auth-input", "id": f"id_{name}"})
            field.widget.attrs = existing

        # Placeholders más descriptivos
        if "username" in self.fields:
            self.fields["username"].widget.attrs.update({"placeholder": "Elige un nombre de usuario"})
        if "email" in self.fields:
            self.fields["email"].widget.attrs.update({"placeholder": "tu@email.com"})
        # allauth puede usar 'password' o 'password1'/'password2' según la configuración
        if "password1" in self.fields:
            self.fields["password1"].widget.attrs.update({"placeholder": "Elige una contraseña segura"})
        if "password2" in self.fields:
            self.fields["password2"].widget.attrs.update({"placeholder": "Repite tu contraseña"})

    def save(self, request):
        # Llamar a la implementación padre para crear el usuario
        user = super().save(request)
        # Aquí podrías asignar datos extra al usuario si añades campos adicionales
        return user


class CustomLoginForm(AllAuthLoginForm):
    """Personaliza el form de login de django-allauth para aplicar widgets.

    Añade clases y placeholders a los campos `login`, `password` y al checkbox `remember`.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Campos que habitualmente trae el LoginForm de allauth
        if "login" in self.fields:
            self.fields["login"].widget.attrs.update({
                "class": "auth-input",
                "placeholder": "Correo o Usuario",
                "id": "id_login",
            })
        if "password" in self.fields:
            self.fields["password"].widget.attrs.update({
                "class": "auth-input",
                "placeholder": "••••••••",
                "id": "id_password",
            })
        if "remember" in self.fields:
            # checkbox
            self.fields["remember"].widget.attrs.update({
                "class": "auth-checkbox",
                "id": "id_remember",
            })
