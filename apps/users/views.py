from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import LoginForm, RegisterForm


def login_view(request):
    """
    Vista de inicio de sesión
    """
    if request.user.is_authenticated:
        return redirect('events:event_list')  # ← CORREGIDO: agregado 'events:'
    
    if request.method == "POST":
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data["username"]
            password = form.cleaned_data["password"]
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'¡Bienvenido de nuevo, {user.username}!')
                
                # Redirigir a la página solicitada o a la lista de eventos
                next_url = request.GET.get('next', 'events:event_list')  # ← CORREGIDO
                return redirect(next_url)
            else:
                messages.error(request, 'Usuario o contraseña incorrectos.')
        else:
            # Mostrar errores del formulario
            for error in form.non_field_errors():
                messages.error(request, error)
    else:
        form = LoginForm()
    
    return render(request, "users/login.html", {"form": form})


def register_view(request):
    """
    Vista de registro de nuevos usuarios
    """
    if request.user.is_authenticated:
        return redirect('events:event_list')  # ← CORREGIDO: agregado 'events:'
    
    if request.method == "POST":
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Auto-login después del registro
            messages.success(request, f'¡Bienvenido a Vivid, {user.username}! Tu cuenta ha sido creada exitosamente.')
            return redirect('events:event_list')  # ← CORREGIDO: agregado 'events:'
        else:
            # Mostrar errores específicos
            for field, errors in form.errors.items():
                for error in errors:
                    if field == '__all__':
                        messages.error(request, error)
                    else:
                        messages.error(request, f'{form.fields[field].label}: {error}')
    else:
        form = RegisterForm()
    
    return render(request, "users/register.html", {"form": form})


@login_required
def logout_view(request):
    """
    Vista de cierre de sesión
    """
    username = request.user.username
    logout(request)
    messages.info(request, f'Has cerrado sesión. ¡Hasta pronto, {username}!')
    return redirect('events:event_list')  # ← CORREGIDO: agregado 'events:'


@login_required
def user_events_view(request):
    """
    Vista de eventos del usuario (creados y suscritos)
    """
    from apps.events.models import Event
    
    # Eventos creados por el usuario
    created_events = Event.objects.filter(owner=request.user).order_by('-date')
    
    # Eventos a los que el usuario está suscrito
    # Esto requiere el modelo HasSubs implementado
    # subscribed_events = Event.objects.filter(hassubs__user=request.user).order_by('-date')
    
    context = {
        'created_events': created_events,
        # 'subscribed_events': subscribed_events,
    }
    
    return render(request, 'users/user_events.html', context)
