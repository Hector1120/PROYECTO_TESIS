import random
import string
import json
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Usuario  
from django.utils import timezone
from datetime import datetime, timedelta, time
from .models import Horario, BloqueHorario, Area, Asignatura, PermisoHorario
from django.core.exceptions import ObjectDoesNotExist


@csrf_exempt
def registrar_horario(request):
    if request.method == "POST":
        try:
            if not request.user.is_authenticated:
                return JsonResponse({"mensaje": "No autorizado"}, status=401)
            data = json.loads(request.body)
            periodo = data.get("periodo", "2025-1")
            dia = data.get("dia")
            hora_inicio_str = data.get("hora_inicio")
            hora_fin_str = data.get("hora_fin")
            docente_id = request.user.id
            # Validar día de la semana
            dias_validos = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
            if dia not in dias_validos:
                return JsonResponse({"mensaje": "Día no válido. Debe ser de lunes a viernes."}, status=400)
            # Convertir horas de string a objeto time
            hora_inicio = datetime.strptime(hora_inicio_str, "%H:%M").time()
            hora_fin = datetime.strptime(hora_fin_str, "%H:%M").time()
            # Definir el rango de horas permitido
            hora_min = time(7, 0)  # 7:00 AM
            hora_max = time(20, 0)  # 8:00 PM
            # Validar el rango de horas
            if hora_inicio < hora_min or hora_inicio > hora_max:
                return JsonResponse({"mensaje": "La hora de inicio debe estar entre 7:00 AM y 8:00 PM"}, status=400)
            if hora_fin < hora_min or hora_fin > hora_max:
                return JsonResponse({"mensaje": "La hora de fin debe estar entre 7:00 AM y 8:00 PM"}, status=400)
            if hora_inicio >= hora_fin:
                return JsonResponse({"mensaje": "La hora de inicio debe ser anterior a la hora de fin"}, status=400)

            # Validar que la diferencia sea múltiplo de 15 minutos
            inicio_minutos = hora_inicio.hour * 60 + hora_inicio.minute
            fin_minutos = hora_fin.hour * 60 + hora_fin.minute
            diferencia_minutos = fin_minutos - inicio_minutos
            
            if diferencia_minutos < 15:
                return JsonResponse({"mensaje": "La duración mínima debe ser de 15 minutos"}, status=400)
            
            if diferencia_minutos % 15 != 0:
                return JsonResponse({"mensaje": "La duración debe ser múltiplo de 15 minutos (15, 30, 45, 60 minutos, etc.)"}, status=400)
            
            # Definir el rango de fechas del periodo
            fecha_inicio = datetime(2025, 2, 5)
            fecha_fin = datetime(2025, 5, 30)
            # Calcular todos los días que corresponden al día seleccionado dentro del rango de fechas
            dias_semana = {
                "Lunes": 0,
                "Martes": 1,
                "Miércoles": 2,
                "Jueves": 3,
                "Viernes": 4,
            }
            dia_seleccionado = dias_semana[dia]
            fechas_a_registrar = []
            current_date = fecha_inicio
            while current_date <= fecha_fin:
                if current_date.weekday() == dia_seleccionado:
                    fechas_a_registrar.append(current_date)
                current_date += timedelta(days=1)
            # Registrar horarios para cada fecha calculada
            for fecha in fechas_a_registrar:
                # Crear nuevo horario sin verificar si ya existe
                horario = Horario.objects.create(
                    docente_id=docente_id,
                    periodo=periodo,
                    dia=dia,
                    fecha=fecha,  # Registrar la fecha
                    hora_inicio=hora_inicio,
                    hora_fin=hora_fin
                )
                # Generar bloques de 15 minutos

                current_time = datetime.combine(fecha, hora_inicio)

                end_time = datetime.combine(fecha, hora_fin)


                while current_time < end_time:

                    BloqueHorario.objects.create(

                    horario=horario,

                    fecha=fecha,

                    hora_inicio=current_time.time(),

                    hora_fin=(current_time + timedelta(minutes=15)).time()

                    )

                    current_time += timedelta(minutes=15)  # Incrementar 15 minutos
                eliminar_horarios_pasados()
            return JsonResponse({"mensaje": "Horarios registrados con éxito"}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Datos inválidos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)


def eliminar_horarios_pasados():
    """Elimina los horarios con fechas anteriores al día actual o con horas pasadas en el día actual"""
    ahora = timezone.localtime(timezone.now())
    fecha_actual = ahora.date()
    hora_actual = ahora.time()

    # Eliminar horarios de fechas anteriores
    Horario.objects.filter(fecha__lt=fecha_actual).delete()

    # Eliminar horarios del día actual que ya han pasado
    Horario.objects.filter(fecha=fecha_actual, hora_fin__lte=hora_actual).delete()
    

@csrf_exempt
def eliminar_horarios_pasados_endpoint(request):
    if request.user.is_authenticated:
        eliminar_horarios_pasados()
        return JsonResponse({"mensaje": "Horarios pasados eliminados"}, status=200)
    return JsonResponse({"mensaje": "No autorizado"}, status=401)

@csrf_exempt
def limpiar_horarios_pasados(request):
    if not request.user.is_authenticated or request.user.rol not in ["Administrador", "Director"]:
        return JsonResponse({"mensaje": "No autorizado"}, status=403)

    eliminar_horarios_pasados()
    return JsonResponse({"mensaje": "Horarios pasados eliminados correctamente"}, status=200)

def generar_contraseña(longitud=8):
    """Genera una contraseña aleatoria con letras y números."""
    caracteres = string.ascii_letters + string.digits
    return ''.join(random.choice(caracteres) for _ in range(longitud))

@csrf_exempt
def recuperar_contraseña(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            correo = data.get("correo")
            
            usuario = Usuario.objects.filter(correo=correo).first()
            if usuario:
                nueva_contraseña = generar_contraseña()
                usuario.set_password(nueva_contraseña)
                usuario.save()
                
                send_mail(
                    "Recuperación de Contraseña - Sistema de Asesorías CESMAG",
                    f"Tu nueva contraseña es: {nueva_contraseña}\nPor favor, cambia tu contraseña después de iniciar sesión.",
                    "lizcanoagudelo2@gmail.com",
                    [correo],
                    fail_silently=False,
                )
                return JsonResponse({"mensaje": "Se ha enviado una nueva contraseña a tu correo."}, status=200)
            else:
                return JsonResponse({"mensaje": "El correo ingresado no está registrado."}, status=404)
        
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos."}, status=400)
    
    return JsonResponse({"mensaje": "Usa el método POST para recuperar la contraseña."}, status=405)

def extraer_rol(nombre):
    """Extrae el rol del nombre, asumiendo que viene entre corchetes al final."""
    if "[Estudiante]" in nombre:
        return "Estudiante"
    elif "[Docente]" in nombre:
        return "Docente"
    return "Estudiante"  # Valor por defecto

def enviar_correo(request):
    usuarios = {
        "hylizcano.1799@unicesmag.edu.co": "Hector Yurbrainer Lizcano Agudelo [Estudiante]",
        "hmsolarte.5416@unicesmag.edu.co": "Hector Mauricio Solarte Muñoz [Docente]",
        # Agrega más usuarios aquí
    }

    contraseñas = {}

    for correo, nombre in usuarios.items():
        contraseña = generar_contraseña()
        rol = extraer_rol(nombre)  # Extraer rol desde el nombre

        # Buscar si el usuario ya existe
        usuario, creado = Usuario.objects.get_or_create(correo=correo)
        
        # Si el usuario ya existía, actualizar el rol y la contraseña
        usuario.rol = rol
        usuario.set_password(contraseña)  # Guarda la contraseña encriptada
        usuario.save()

        contraseñas[correo] = contraseña  # Guardamos en el diccionario
        
        send_mail(
            "Acceso al Sistema de Asesorías CESMAG",
            f"Tu contraseña por defecto es: {contraseña}\nTu rol es: {rol}",
            "lizcanoagudelo2@gmail.com",
            [correo],
            fail_silently=False,
        )

    return JsonResponse({"mensaje": "Correos enviados y usuarios actualizados", "contraseñas": contraseñas})

# Modificar la función login_usuario en views.py
@csrf_exempt
def login_usuario(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            correo = data.get("correo")
            contraseña = data.get("contraseña")

            usuario = Usuario.objects.filter(correo=correo).first()

            if usuario and usuario.check_password(contraseña):
                # Usar el sistema de autenticación de Django
                from django.contrib.auth import login
                login(request, usuario)
                
                # Incluir subtipo_director en la respuesta
                return JsonResponse({
                    "mensaje": "Inicio de sesión exitoso", 
                    "rol": usuario.rol,
                    "correo": usuario.correo,
                    "subtipo_director": usuario.subtipo_director if hasattr(usuario, 'subtipo_director') else ""
                }, status=200)
            else:
                return JsonResponse({"mensaje": "El correo o la contraseña no son correctos"}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)

    return JsonResponse({"mensaje": "Usa el método POST para iniciar sesión"}, status=405)

# También asegúrate de incluir el subtipo_director en verificar_sesion
@csrf_exempt
def verificar_sesion(request):
    # Verifica si hay una sesión activa
    if request.user.is_authenticated:
        return JsonResponse({
            "autenticado": True,
            "usuario": {
                "correo": request.user.correo,
                "rol": request.user.rol,
                "subtipo_director": request.user.subtipo_director if hasattr(request.user, 'subtipo_director') else ""
            }
        })
    else:
        return JsonResponse({"autenticado": False}, status=401)
    
# Añadir a views.py
@csrf_exempt
def logout_usuario(request):
    from django.contrib.auth import logout
    logout(request)
    return JsonResponse({"mensaje": "Sesión cerrada correctamente"})


@csrf_exempt
def obtener_horarios(request):
    if request.method == "GET":
        try:
            if not request.user.is_authenticated:
                return JsonResponse({"mensaje": "No autorizado"}, status=401)
            
            # Obtener el docente actual
            docente_id = request.user.id
            
            # Buscar todos los bloques de horario del docente
            horarios = Horario.objects.filter(docente_id=docente_id)
            bloques_horario = []
            
            for horario in horarios:
                # Obtener bloques asociados a este horario
                bloques = BloqueHorario.objects.filter(horario=horario)
                
                for bloque in bloques:
                    bloques_horario.append({
                        "horario_id": horario.id,
                        "dia": horario.dia,
                        "fecha": bloque.fecha.strftime("%Y-%m-%d"),
                        "hora_inicio": bloque.hora_inicio.strftime("%H:%M"),
                        "hora_fin": bloque.hora_fin.strftime("%H:%M"),
                        "periodo": horario.periodo
                    })
            
            return JsonResponse({"bloques": bloques_horario}, status=200)
        
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def obtener_horarios_docentes(request):
    if request.method == "GET":
        if not request.user.is_authenticated or request.user.rol != "Director":
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
        
        try:
            # Obtener el subtipo del director
            subtipo_director = request.user.subtipo_director
            subtipo_docente_permitido = None
            
            # Mapear subtipo de director a subtipo de docente
            if subtipo_director == "Director de Ing.Sistemas":
                subtipo_docente_permitido = "Docente de Ing.Sistemas"
            elif subtipo_director == "Director de Ing.Electrónica":
                subtipo_docente_permitido = "Docente de Ing.Electrónica"
            elif subtipo_director == "Director de Humanidades":
                subtipo_docente_permitido = "Docente de Humanidades"
            elif subtipo_director == "Director de Idiomas":
                subtipo_docente_permitido = "Docente de Idiomas"
            elif subtipo_director == "Director de Ciencias Básicas":
                subtipo_docente_permitido = "Docente de Ciencias Básicas"
            
            # Obtener todos los docentes del subtipo correspondiente
            docentes = Usuario.objects.filter(
                rol="Docente", 
                subtipo_docente=subtipo_docente_permitido
            )
            
            # Obtener los horarios de cada docente
            resultados = []
            
            for docente in docentes:
                horarios = Horario.objects.filter(docente_id=docente.id)
                horarios_docente = []
                
                for horario in horarios:
                    # Verificar si este horario tiene permisos especiales
                    try:
                        permiso = PermisoHorario.objects.get(horario=horario)
                        puede_editar = permiso.puede_editar
                        puede_eliminar = permiso.puede_eliminar
                    except ObjectDoesNotExist:
                        puede_editar = False
                        puede_eliminar = False
                    
                    horarios_docente.append({
                        "id": horario.id,
                        "dia": horario.dia,
                        "fecha": horario.fecha.strftime("%Y-%m-%d"),
                        "hora_inicio": horario.hora_inicio.strftime("%H:%M"),
                        "hora_fin": horario.hora_fin.strftime("%H:%M"),
                        "periodo": horario.periodo,
                        "puede_editar": puede_editar,
                        "puede_eliminar": puede_eliminar
                    })
                
                if horarios_docente:  # Solo agregar docentes con horarios
                    resultados.append({
                        "docente_id": docente.id,
                        "correo": docente.correo,
                        "subtipo_docente": docente.subtipo_docente,
                        "horarios": horarios_docente
                    })
            
            return JsonResponse({"docentes_horarios": resultados}, status=200)
            
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def actualizar_permisos_horario(request):
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.rol != "Director":
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
        
        try:
            data = json.loads(request.body)
            horario_id = data.get("horario_id")
            puede_editar = data.get("puede_editar", False)
            puede_eliminar = data.get("puede_eliminar", False)
            
            horario = Horario.objects.get(id=horario_id)
            
            # Crear o actualizar los permisos
            permiso, created = PermisoHorario.objects.get_or_create(
                horario=horario,
                defaults={
                    "puede_editar": puede_editar,
                    "puede_eliminar": puede_eliminar
                }
            )
            
            if not created:
                permiso.puede_editar = puede_editar
                permiso.puede_eliminar = puede_eliminar
                permiso.save()
            
            return JsonResponse({
                "mensaje": "Permisos actualizados correctamente",
                "horario_id": horario_id,
                "puede_editar": puede_editar,
                "puede_eliminar": puede_eliminar
            }, status=200)
            
        except ObjectDoesNotExist:
            return JsonResponse({"mensaje": "Horario no encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def verificar_permisos_horario(request, horario_id):
    if request.method == "GET":
        if not request.user.is_authenticated or request.user.rol != "Docente":
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
        
        try:
            # Verificar que el horario pertenezca al docente
            horario = Horario.objects.get(id=horario_id, docente_id=request.user.id)
            
            # Buscar los permisos asociados
            try:
                permiso = PermisoHorario.objects.get(horario=horario)
                return JsonResponse({
                    "puede_editar": permiso.puede_editar,
                    "puede_eliminar": permiso.puede_eliminar
                }, status=200)
            except ObjectDoesNotExist:
                return JsonResponse({
                    "puede_editar": False,
                    "puede_eliminar": False
                }, status=200)
                
        except ObjectDoesNotExist:
            return JsonResponse({"mensaje": "Horario no encontrado"}, status=404)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def editar_horario(request):
    if request.method == "PUT":
        try:
            if not request.user.is_authenticated or request.user.rol != "Docente":
                return JsonResponse({"mensaje": "No autorizado"}, status=401)
            
            data = json.loads(request.body)
            horario_id = data.get("horario_id")
            dia = data.get("dia")
            fecha_str = data.get("fecha")  # Nueva variable para recibir la fecha
            hora_inicio_str = data.get("hora_inicio")
            hora_fin_str = data.get("hora_fin")
            
            # Verificar que el horario pertenezca al docente
            try:
                horario = Horario.objects.get(id=horario_id, docente_id=request.user.id)
            except ObjectDoesNotExist:
                return JsonResponse({"mensaje": "Horario no encontrado"}, status=404)
            
            # Verificar permisos de edición
            try:
                permiso = PermisoHorario.objects.get(horario=horario)
                if not permiso.puede_editar:
                    return JsonResponse({"mensaje": "No tiene permiso para editar este horario"}, status=403)
            except ObjectDoesNotExist:
                return JsonResponse({"mensaje": "No tiene permiso para editar este horario"}, status=403)
            
            # Validar datos
            dias_validos = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
            if dia not in dias_validos:
                return JsonResponse({"mensaje": "Día no válido. Debe ser de lunes a viernes."}, status=400)
            
            # Validar y convertir la fecha
            try:
                fecha = datetime.strptime(fecha_str, "%Y-%m-%d").date()
            except ValueError:
                return JsonResponse({"mensaje": "Formato de fecha inválido. Use YYYY-MM-DD."}, status=400)
            
            # Validar que el día de la semana coincida con la fecha
            weekday_map = {
                0: 'Lunes',
                1: 'Martes',
                2: 'Miércoles',
                3: 'Jueves',
                4: 'Viernes',
                5: 'Sábado',
                6: 'Domingo'
            }
            dia_semana_python = fecha.weekday()  # Python's weekday() returns 0 for Monday
            dia_esperado = weekday_map[dia_semana_python]
            if dia != dia_esperado:
                return JsonResponse({
                    "mensaje": f"El día seleccionado ({dia}) no coincide con el día de la fecha seleccionada ({dias_es[dia_semana]})"
                }, status=400)
            
            hora_inicio = datetime.strptime(hora_inicio_str, "%H:%M").time()
            hora_fin = datetime.strptime(hora_fin_str, "%H:%M").time()
            
            # Definir el rango de horas permitido
            hora_min = time(7, 0)  # 7:00 AM
            hora_max = time(20, 0)  # 8:00 PM
            
            # Validar el rango de horas
            if hora_inicio < hora_min or hora_inicio > hora_max:
                return JsonResponse({"mensaje": "La hora de inicio debe estar entre 7:00 AM y 8:00 PM"}, status=400)
            if hora_fin < hora_min or hora_fin > hora_max:
                return JsonResponse({"mensaje": "La hora de fin debe estar entre 7:00 AM y 8:00 PM"}, status=400)
            if hora_inicio >= hora_fin:
                return JsonResponse({"mensaje": "La hora de inicio debe ser anterior a la hora de fin"}, status=400)

            # Actualizar horario
            horario.dia = dia
            horario.fecha = fecha  # Actualizar la fecha
            horario.hora_inicio = hora_inicio
            horario.hora_fin = hora_fin
            horario.save()
            
            # Actualizar bloques de horario
            # Primero eliminar los bloques existentes
            BloqueHorario.objects.filter(horario=horario).delete()
            
            # Crear nuevos bloques
            current_time = datetime.combine(fecha, hora_inicio)  # Usar la nueva fecha
            end_time = datetime.combine(fecha, hora_fin)  # Usar la nueva fecha
            
            while current_time < end_time:
                BloqueHorario.objects.create(
                    horario=horario,
                    fecha=fecha,  # Usar la nueva fecha
                    hora_inicio=current_time.time(),
                    hora_fin=(current_time + timedelta(minutes=15)).time()
                )
                current_time += timedelta(minutes=15)
            
            return JsonResponse({"mensaje": "Horario actualizado con éxito"}, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Datos inválidos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def eliminar_horario(request):
    if request.method == "DELETE":
        try:
            if not request.user.is_authenticated or request.user.rol != "Docente":
                return JsonResponse({"mensaje": "No autorizado"}, status=401)
            
            data = json.loads(request.body)
            horario_id = data.get("horario_id")
            
            # Verificar que el horario pertenezca al docente
            try:
                horario = Horario.objects.get(id=horario_id, docente_id=request.user.id)
            except ObjectDoesNotExist:
                return JsonResponse({"mensaje": "Horario no encontrado"}, status=404)
            
            # Verificar permisos de eliminación
            try:
                permiso = PermisoHorario.objects.get(horario=horario)
                if not permiso.puede_eliminar:
                    return JsonResponse({"mensaje": "No tiene permiso para eliminar este horario"}, status=403)
            except ObjectDoesNotExist:
                return JsonResponse({"mensaje": "No tiene permiso para eliminar este horario"}, status=403)
            
            # Eliminar horario y sus bloques (la eliminación en cascada se encargará de los bloques)
            horario.delete()
            
            return JsonResponse({"mensaje": "Horario eliminado con éxito"}, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Datos inválidos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def listar_usuarios(request):
    """Obtiene todos los usuarios del sistema"""
    if request.method == "GET":
        if not request.user.is_authenticated or request.user.rol not in ["Administrador", "Director"]:
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
        
        try:
            usuarios = Usuario.objects.all()
            data = []
            
            for usuario in usuarios:
                data.append({
                    "id": usuario.id,
                    "correo": usuario.correo,
                    "rol": usuario.rol,
                    "is_active": usuario.is_active,
                    "is_staff": usuario.is_staff,
                    "subtipo_director": usuario.subtipo_director if hasattr(usuario, 'subtipo_director') else "",
                    "subtipo_docente": usuario.subtipo_docente if hasattr(usuario, 'subtipo_docente') else ""
                })
            
            return JsonResponse(data, safe=False)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def crear_usuario(request):
    """Crea un nuevo usuario y envía la contraseña por correo"""
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.rol not in ["Administrador", "Director"]:
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
       
        try:
            data = json.loads(request.body)
           
            # Validar que se envíen los campos requeridos
            if "correo" not in data:
                return JsonResponse({"mensaje": "El correo es requerido"}, status=400)
           
            # Verificar si ya existe un usuario con el mismo correo
            if Usuario.objects.filter(correo=data["correo"]).exists():
                return JsonResponse({"mensaje": "Ya existe un usuario con este correo"}, status=400)
            
            # Si es un director, validar que se incluya el subtipo y que no esté duplicado
            if data.get("rol") == "Director":
                if not data.get("subtipo_director"):
                    return JsonResponse({"mensaje": "El tipo de director es requerido"}, status=400)
                
                # Verificar si ya existe un usuario con ese subtipo de director
                if Usuario.objects.filter(rol="Director", subtipo_director=data.get("subtipo_director")).exists():
                    return JsonResponse({"mensaje": f"Ya existe un '{data.get('subtipo_director')}' registrado"}, status=400)
            
            # Si es un docente, validar que se incluya el subtipo
            if data.get("rol") == "Docente" and not data.get("subtipo_docente"):
                return JsonResponse({"mensaje": "El tipo de docente es requerido"}, status=400)
           
            # Generar contraseña aleatoria
            contraseña = generar_contraseña()
           
            # Determinar si el usuario es superusuario basado en su rol
            es_superusuario = data.get("rol") in ["Administrador", "Director"]
           
            # Crear el nuevo usuario
            nuevo_usuario = Usuario(
                correo=data["correo"],
                rol=data.get("rol", "Estudiante"),
                subtipo_director=data.get("subtipo_director", ""),
                subtipo_docente=data.get("subtipo_docente", ""),
                is_active=data.get("is_active", True),
                is_staff=es_superusuario,
                is_superuser=es_superusuario
            )
            nuevo_usuario.set_password(contraseña)
            nuevo_usuario.save()
           
            # Enviar correo con la contraseña
            send_mail(
                "Acceso al Sistema de Asesorías CESMAG",
                f"Tú contraseña de acceso es: {contraseña}\n\n" +
                f"Y tu rol es : {nuevo_usuario.rol}" +
                (f" - {nuevo_usuario.subtipo_director}" if nuevo_usuario.subtipo_director else "") +
                (f" - {nuevo_usuario.subtipo_docente}" if nuevo_usuario.subtipo_docente else "") + ".",
                "lizcanoagudelo2@gmail.com",
                [data["correo"]],
                fail_silently=False,
            )
           
            return JsonResponse({
                "mensaje": "Usuario creado exitosamente. Contraseña enviada por correo.",
                "id": nuevo_usuario.id
            }, status=201)
           
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
   
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def detalle_usuario(request, usuario_id):
    """Obtiene, actualiza o elimina un usuario específico"""
    if not request.user.is_authenticated or request.user.rol not in ["Administrador", "Director"]:
        return JsonResponse({"mensaje": "No autorizado"}, status=403)
    
    try:
        usuario = Usuario.objects.get(id=usuario_id)
    except ObjectDoesNotExist:
        return JsonResponse({"mensaje": "Usuario no encontrado"}, status=404)
    
    # GET: Obtener detalle de un usuario
    if request.method == "GET":
        data = {
            "id": usuario.id,
            "correo": usuario.correo,
            "password": usuario.password,
            "rol": usuario.rol,
            "subtipo_director": usuario.subtipo_director if hasattr(usuario, 'subtipo_director') else "",
            "subtipo_docente": usuario.subtipo_docente if hasattr(usuario, 'subtipo_docente') else "",
            "is_active": usuario.is_active,
            "is_staff": usuario.is_staff
        }
        return JsonResponse(data)
    
    # PUT: Actualizar un usuario
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            # Actualizar datos del usuario
            if "correo" in data:
                # Verificar si el nuevo correo ya existe y no es del usuario actual
                if Usuario.objects.filter(correo=data["correo"]).exclude(id=usuario_id).exists():
                    return JsonResponse({"mensaje": "El correo ya está en uso por otro usuario"}, status=400)
                usuario.correo = data["correo"]
            
            if "rol" in data:
                old_rol = usuario.rol
                new_rol = data["rol"]
                
                # Validar que el rol sea válido
                if new_rol not in dict(Usuario.ROLES):
                    return JsonResponse({"mensaje": f"Rol no válido. Opciones: {', '.join(dict(Usuario.ROLES).keys())}"}, status=400)
                
                # Si cambia a Director, verificar que tenga subtipo_director
                if new_rol == "Director" and "subtipo_director" in data:
                    # Verificar que el subtipo no esté ya asignado a otro director
                    if Usuario.objects.filter(
                        rol="Director", 
                        subtipo_director=data["subtipo_director"]
                    ).exclude(id=usuario_id).exists():
                        return JsonResponse({"mensaje": f"Ya existe un '{data['subtipo_director']}' registrado"}, status=400)
                    
                    # Asignar el subtipo de director
                    usuario.subtipo_director = data["subtipo_director"]
                    usuario.subtipo_docente = ""  # Limpiar el subtipo de docente
                
                # Si cambia a Docente, validar el subtipo_docente
                elif new_rol == "Docente" and "subtipo_docente" in data:
                    usuario.subtipo_docente = data["subtipo_docente"]
                    usuario.subtipo_director = ""  # Limpiar el subtipo de director
                
                # Si cambia de Director/Docente a otro rol, limpiar los subtipos
                else:
                    if old_rol == "Director":
                        usuario.subtipo_director = ""
                    elif old_rol == "Docente":
                        usuario.subtipo_docente = ""
                
                usuario.rol = new_rol
                # Actualizar is_staff si el rol es Administrador o Director
                usuario.is_staff = True if new_rol in ["Administrador", "Director"] else False
                usuario.is_superuser = True if new_rol in ["Administrador", "Director"] else False
            
            # Si no cambia el rol pero sí el subtipo (siendo Director)
            elif usuario.rol == "Director" and "subtipo_director" in data:
                # Verificar que el subtipo no esté ya asignado a otro director
                if Usuario.objects.filter(
                    rol="Director", 
                    subtipo_director=data["subtipo_director"]
                ).exclude(id=usuario_id).exists():
                    return JsonResponse({"mensaje": f"Ya existe un '{data['subtipo_director']}' registrado"}, status=400)
                
                usuario.subtipo_director = data["subtipo_director"]
            
            # Si no cambia el rol pero sí el subtipo (siendo Docente)
            elif usuario.rol == "Docente" and "subtipo_docente" in data:
                usuario.subtipo_docente = data["subtipo_docente"]
            
            if "is_active" in data:
                usuario.is_active = data["is_active"]
            
            if "password" in data and data["password"]:
                usuario.set_password(data["password"])
            
            usuario.save()
            return JsonResponse({"mensaje": "Usuario actualizado exitosamente"})
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    # DELETE: Eliminar un usuario
    elif request.method == "DELETE":
        usuario.delete()
        return JsonResponse({"mensaje": "Usuario eliminado exitosamente"})
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def obtener_perfil_usuario(request):
    """Obtiene los detalles del perfil del usuario autenticado"""
    if request.method == "GET":
        if not request.user.is_authenticated:
            return JsonResponse({"mensaje": "No autorizado"}, status=401)
        
        try:
            usuario = request.user
            # Convertir last_login a la zona horaria local
            last_login = usuario.last_login
            if last_login:
                last_login = timezone.localtime(last_login).strftime("%Y-%m-%d %H:%M:%S")
            
            data = {
                "correo": usuario.correo,
                "rol": usuario.rol,
                "last_login": last_login,
                "is_active": usuario.is_active,
            }
            
            return JsonResponse(data)
        
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def cambiar_contraseña(request):
    """Permite al usuario cambiar su contraseña actual"""
    if request.method == "POST":
        if not request.user.is_authenticated:
            return JsonResponse({"mensaje": "No autorizado"}, status=401)
        
        try:
            data = json.loads(request.body)
            contraseña_actual = data.get("contraseña_actual")
            nueva_contraseña = data.get("nueva_contraseña")
            
            # Validar que se envíen los campos requeridos
            if not contraseña_actual or not nueva_contraseña:
                return JsonResponse({"mensaje": "La contraseña actual y la nueva contraseña son requeridas"}, status=400)
            
            # Verificar que la contraseña actual sea correcta
            usuario = request.user
            if not usuario.check_password(contraseña_actual):
                return JsonResponse({"mensaje": "La contraseña actual es incorrecta"}, status=400)
            
            # Validar complejidad de la nueva contraseña
            if len(nueva_contraseña) < 8:
                return JsonResponse({"mensaje": "La nueva contraseña debe tener al menos 8 caracteres"}, status=400)
            
            # Verificar que la nueva contraseña contenga al menos una letra mayúscula,
            # una minúscula y un número
            if not any(c.isupper() for c in nueva_contraseña):
                return JsonResponse({"mensaje": "La nueva contraseña debe contener al menos una letra mayúscula"}, status=400)
            
            if not any(c.islower() for c in nueva_contraseña):
                return JsonResponse({"mensaje": "La nueva contraseña debe contener al menos una letra minúscula"}, status=400)
                
            if not any(c.isdigit() for c in nueva_contraseña):
                return JsonResponse({"mensaje": "La nueva contraseña debe contener al menos un número"}, status=400)
            
            # Cambiar la contraseña
            usuario.set_password(nueva_contraseña)
            usuario.save()
            
            # Actualizar la sesión para que el usuario no tenga que iniciar sesión nuevamente
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, usuario)
            
            return JsonResponse({"mensaje": "Contraseña actualizada exitosamente"}, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)


@csrf_exempt
def crear_estudiante(request):
    """Crea un nuevo usuario con rol Estudiante y envía la contraseña por correo"""
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.rol not in ["Administrador", "Director"]:
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
       
        try:
            data = json.loads(request.body)
           
            # Validar que se envíen los campos requeridos
            if "correo" not in data:
                return JsonResponse({"mensaje": "El correo es requerido"}, status=400)
           
            # Verificar si ya existe un usuario con el mismo correo
            if Usuario.objects.filter(correo=data["correo"]).exists():
                return JsonResponse({"mensaje": "Ya existe un usuario con este correo"}, status=400)
           
            # Generar contraseña aleatoria
            contraseña = generar_contraseña()
           
            # Crear el nuevo usuario (siempre como Estudiante)
            nuevo_estudiante = Usuario(
                correo=data["correo"],
                rol="Estudiante",
                is_active=data.get("is_active", True),
                is_staff=False,
                is_superuser=False
            )
            nuevo_estudiante.set_password(contraseña)
            nuevo_estudiante.save()
           
            # Enviar correo con la contraseña
            send_mail(
                "Acceso al Sistema de Asesorías CESMAG",
                f"Tú contraseña de acceso es: {contraseña}\n\n" +
                f"Y tu rol es: Estudiante.",
                "lizcanoagudelo2@gmail.com",
                [data["correo"]],
                fail_silently=False,
            )
           
            return JsonResponse({
                "mensaje": "Estudiante creado exitosamente. Contraseña enviada por correo.",
                "id": nuevo_estudiante.id
            }, status=201)
           
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
   
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)


@csrf_exempt
def listar_estudiantes(request):
    """Obtiene todos los usuarios con rol Estudiante"""
    if request.method == "GET":
        if not request.user.is_authenticated or request.user.rol not in ["Administrador", "Director"]:
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
        
        try:
            # Filtrar solo usuarios con rol Estudiante
            estudiantes = Usuario.objects.filter(rol="Estudiante")
            data = []
            
            for estudiante in estudiantes:
                data.append({
                    "id": estudiante.id,
                    "correo": estudiante.correo,
                    "rol": estudiante.rol,
                    "is_active": estudiante.is_active
                })
            
            return JsonResponse(data, safe=False)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)


@csrf_exempt
def detalle_estudiante(request, estudiante_id):
    """Obtiene, actualiza o elimina un usuario con rol Estudiante"""
    if not request.user.is_authenticated or request.user.rol not in ["Administrador", "Director"]:
        return JsonResponse({"mensaje": "No autorizado"}, status=403)
    
    try:
        # Verificar que exista y sea un Estudiante
        estudiante = Usuario.objects.get(id=estudiante_id, rol="Estudiante")
    except ObjectDoesNotExist:
        return JsonResponse({"mensaje": "Estudiante no encontrado"}, status=404)
    
    # GET: Obtener detalle de un estudiante
    if request.method == "GET":
        data = {
            "id": estudiante.id,
            "correo": estudiante.correo,
            "rol": estudiante.rol,
            "is_active": estudiante.is_active
        }
        return JsonResponse(data)
    
    # PUT: Actualizar un estudiante
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            # Actualizar datos del estudiante (no se permite cambiar el rol)
            if "correo" in data:
                # Verificar si el nuevo correo ya existe y no es del usuario actual
                if Usuario.objects.filter(correo=data["correo"]).exclude(id=estudiante_id).exists():
                    return JsonResponse({"mensaje": "El correo ya está en uso por otro usuario"}, status=400)
                estudiante.correo = data["correo"]
            
            # Ignorar cambios de rol si se intenta
            if "rol" in data and data["rol"] != "Estudiante":
                return JsonResponse({"mensaje": "No se permite cambiar el rol de un Estudiante"}, status=400)
            
            if "is_active" in data:
                estudiante.is_active = data["is_active"]
            
            if "password" in data and data["password"]:
                estudiante.set_password(data["password"])
            
            estudiante.save()
            return JsonResponse({"mensaje": "Estudiante actualizado exitosamente"})
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    # DELETE: Eliminar un estudiante
    elif request.method == "DELETE":
        estudiante.delete()
        return JsonResponse({"mensaje": "Estudiante eliminado exitosamente"})
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def crear_docente(request):
    """Crea un nuevo usuario con rol Docente y envía la contraseña por correo"""
    if request.method == "POST":
        if not request.user.is_authenticated or request.user.rol != "Director":
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
        
        try:
            data = json.loads(request.body)
            
            # Validar que se envíen los campos requeridos
            if "correo" not in data or "subtipo_docente" not in data:
                return JsonResponse({"mensaje": "El correo y subtipo del docente son requeridos"}, status=400)
            
            # Verificar que el subtipo_docente corresponda al subtipo_director
            subtipo_director = request.user.subtipo_director
            subtipo_docente_permitido = None
            
            if subtipo_director == "Director de Ing.Sistemas":
                subtipo_docente_permitido = "Docente de Ing.Sistemas"
            elif subtipo_director == "Director de Ing.Electrónica":
                subtipo_docente_permitido = "Docente de Ing.Electrónica"
            elif subtipo_director == "Director de Humanidades":
                subtipo_docente_permitido = "Docente de Humanidades"
            elif subtipo_director == "Director de Idiomas":
                subtipo_docente_permitido = "Docente de Idiomas"
            elif subtipo_director == "Director de Ciencias Básicas":
                subtipo_docente_permitido = "Docente de Ciencias Básicas"
            
            if data["subtipo_docente"] != subtipo_docente_permitido:
                return JsonResponse({
                    "mensaje": f"Como {subtipo_director}, solo puede crear docentes de tipo {subtipo_docente_permitido}"
                }, status=400)
            
            # Verificar si ya existe un usuario con el mismo correo
            if Usuario.objects.filter(correo=data["correo"]).exists():
                return JsonResponse({"mensaje": "Ya existe un usuario con este correo"}, status=400)
            
            # Generar contraseña aleatoria
            contraseña = generar_contraseña()
            
            # Crear el nuevo usuario (siempre como Docente)
            nuevo_docente = Usuario(
                correo=data["correo"],
                rol="Docente",
                subtipo_docente=data["subtipo_docente"],
                is_active=data.get("is_active", True),
                is_staff=False,
                is_superuser=False
            )
            nuevo_docente.set_password(contraseña)
            nuevo_docente.save()
            
            # Enviar correo con la contraseña
            send_mail(
                "Acceso al Sistema de Asesorías CESMAG",
                f"Tú contraseña de acceso es: {contraseña}\n\n" +
                f"Y tu rol es: Docente ({data['subtipo_docente']}).",
                "lizcanoagudelo2@gmail.com",
                [data["correo"]],
                fail_silently=False,
            )
            
            return JsonResponse({
                "mensaje": "Docente creado exitosamente. Contraseña enviada por correo.",
                "id": nuevo_docente.id
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)


@csrf_exempt
def listar_docentes(request):
    """Obtiene todos los usuarios con rol Docente según el subtipo del director"""
    if request.method == "GET":
        if not request.user.is_authenticated or request.user.rol != "Director":
            return JsonResponse({"mensaje": "No autorizado"}, status=403)
        
        try:
            # Determinar qué subtipo de docente puede gestionar este director
            subtipo_director = request.user.subtipo_director
            subtipo_docente_permitido = None
            
            if subtipo_director == "Director de Ing.Sistemas":
                subtipo_docente_permitido = "Docente de Ing.Sistemas"
            elif subtipo_director == "Director de Ing.Electrónica":
                subtipo_docente_permitido = "Docente de Ing.Electrónica"
            elif subtipo_director == "Director de Humanidades":
                subtipo_docente_permitido = "Docente de Humanidades"
            elif subtipo_director == "Director de Idiomas":
                subtipo_docente_permitido = "Docente de Idiomas"
            elif subtipo_director == "Director de Ciencias Básicas":
                subtipo_docente_permitido = "Docente de Ciencias Básicas"
            
            # Filtrar solo usuarios con rol Docente y el subtipo correspondiente
            docentes = Usuario.objects.filter(
                rol="Docente", 
                subtipo_docente=subtipo_docente_permitido
            )
            data = []
            
            for docente in docentes:
                data.append({
                    "id": docente.id,
                    "correo": docente.correo,
                    "rol": docente.rol,
                    "subtipo_docente": docente.subtipo_docente,
                    "is_active": docente.is_active
                })
            
            return JsonResponse(data, safe=False)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)


@csrf_exempt
def detalle_docente(request, docente_id):
    """Obtiene, actualiza o elimina un usuario con rol Docente"""
    if not request.user.is_authenticated or request.user.rol != "Director":
        return JsonResponse({"mensaje": "No autorizado"}, status=403)
    
    # Determinar qué subtipo de docente puede gestionar este director
    subtipo_director = request.user.subtipo_director
    subtipo_docente_permitido = None
    
    if subtipo_director == "Director de Ing.Sistemas":
        subtipo_docente_permitido = "Docente de Ing.Sistemas"
    elif subtipo_director == "Director de Ing.Electrónica":
        subtipo_docente_permitido = "Docente de Ing.Electrónica"
    elif subtipo_director == "Director de Humanidades":
        subtipo_docente_permitido = "Docente de Humanidades"
    elif subtipo_director == "Director de Idiomas":
        subtipo_docente_permitido = "Docente de Idiomas"
    elif subtipo_director == "Director de Ciencias Básicas":
        subtipo_docente_permitido = "Docente de Ciencias Básicas"
    
    try:
        # Verificar que exista y sea un Docente del subtipo permitido
        docente = Usuario.objects.get(
            id=docente_id, 
            rol="Docente",
            subtipo_docente=subtipo_docente_permitido
        )
    except ObjectDoesNotExist:
        return JsonResponse({"mensaje": "Docente no encontrado o no tiene permisos para gestionarlo"}, status=404)
    
    # GET: Obtener detalle de un docente
    if request.method == "GET":
        data = {
            "id": docente.id,
            "correo": docente.correo,
            "rol": docente.rol,
            "subtipo_docente": docente.subtipo_docente,
            "is_active": docente.is_active
        }
        return JsonResponse(data)
    
    # PUT: Actualizar un docente
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            # Actualizar datos del docente (no se permite cambiar el rol ni el subtipo)
            if "correo" in data:
                # Verificar si el nuevo correo ya existe y no es del usuario actual
                if Usuario.objects.filter(correo=data["correo"]).exclude(id=docente_id).exists():
                    return JsonResponse({"mensaje": "El correo ya está en uso por otro usuario"}, status=400)
                docente.correo = data["correo"]
            
            # Ignorar cambios de rol si se intenta
            if "rol" in data and data["rol"] != "Docente":
                return JsonResponse({"mensaje": "No se permite cambiar el rol de un Docente"}, status=400)
            
            # Ignorar cambios de subtipo si se intenta
            if "subtipo_docente" in data and data["subtipo_docente"] != subtipo_docente_permitido:
                return JsonResponse({"mensaje": f"No se permite cambiar el subtipo de un {subtipo_docente_permitido}"}, status=400)
            
            if "is_active" in data:
                docente.is_active = data["is_active"]
            
            if "password" in data and data["password"]:
                docente.set_password(data["password"])
            
            docente.save()
            return JsonResponse({"mensaje": "Docente actualizado exitosamente"})
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    # DELETE: Eliminar un docente
    elif request.method == "DELETE":
        docente.delete()
        return JsonResponse({"mensaje": "Docente eliminado exitosamente"})
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def gestionar_asignatura(request):
    """Crea, actualiza, elimina o lista asignaturas con sus áreas y docentes asociados"""
    
    # Verificar autenticación y permisos
    if not request.user.is_authenticated:
        return JsonResponse({"mensaje": "No autorizado"}, status=401)
    
    # Solo administradores, directores y docentes pueden gestionar asignaturas
    if request.user.rol not in ["Administrador", "Director", "Docente"]:
        return JsonResponse({"mensaje": "No tiene permisos para gestionar asignaturas"}, status=403)
    
    # POST: Crear una nueva asignatura
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            
            # Validar campos requeridos
            campos_requeridos = ["nombre", "area", "semestre"]
            for campo in campos_requeridos:
                if campo not in data:
                    return JsonResponse({"mensaje": f"El campo '{campo}' es requerido"}, status=400)
            
            # Validar que el semestre sea válido
            semestres_validos = [choice[0] for choice in Asignatura.SEMESTRES]
            if data["semestre"] not in semestres_validos:
                return JsonResponse({
                    "mensaje": f"Semestre no válido. Opciones válidas: {', '.join(semestres_validos)}"
                }, status=400)
            
            # Obtener o crear el área
            area_nombre = data["area"]
            
            # Si es director, buscar o crear área solo dentro de su subtipo
            if request.user.rol == "Director":
                try:
                    area = Area.objects.get(
                        nombre=area_nombre, 
                        subtipo_director=request.user.subtipo_director
                    )
                except ObjectDoesNotExist:
                    # Si el área no existe, crearla asociada al director actual
                    area = Area.objects.create(
                        nombre=area_nombre,
                        director_creador=request.user,
                        subtipo_director=request.user.subtipo_director
                    )
            else:
                # Para administradores, buscar área por nombre sin restricción
                try:
                    area = Area.objects.get(nombre=area_nombre)
                except ObjectDoesNotExist:
                    # Si es administrador, asociar el área a sí mismo
                    area = Area.objects.create(
                        nombre=area_nombre,
                        director_creador=request.user,
                        subtipo_director="Administración"  # Valor predeterminado para administradores
                    )
            
            # Verificar si ya existe una asignatura con el mismo nombre y área
            if Asignatura.objects.filter(nombre=data["nombre"], area=area).exists():
                return JsonResponse({
                    "mensaje": f"Ya existe una asignatura con el nombre '{data['nombre']}' en el área '{area_nombre}'"
                }, status=400)
            
            # Determinar si usar los docentes del área o asignar docentes específicos
            usar_docentes_area = data.get("usar_docentes_area", True)
            
            # Crear la asignatura
            nueva_asignatura = Asignatura(
                nombre=data["nombre"],
                area=area,
                semestre=data["semestre"],
                director_creador=request.user,
                subtipo_director=request.user.subtipo_director if request.user.rol == "Director" else "Administración",
                usar_docentes_area=usar_docentes_area
            )
            nueva_asignatura.save()
            
            # Agregar docentes específicos sólo si no se usan los docentes del área
            if not usar_docentes_area and "docentes" in data and isinstance(data["docentes"], list):
                for correo_docente in data["docentes"]:
                    try:
                        docente = Usuario.objects.get(correo=correo_docente, rol="Docente")
                        nueva_asignatura.docentes.add(docente)
                    except ObjectDoesNotExist:
                        # No agregamos el docente si no existe o no es un docente
                        pass
            
            # Obtener docentes para la respuesta
            if usar_docentes_area:
                docentes = list(area.docentes.values_list('correo', flat=True))
            else:
                docentes = list(nueva_asignatura.docentes.values_list('correo', flat=True))
            
            return JsonResponse({
                "mensaje": "Asignatura creada exitosamente",
                "id": nueva_asignatura.id,
                "nombre": nueva_asignatura.nombre,
                "area": nueva_asignatura.area.nombre,
                "semestre": nueva_asignatura.semestre,
                "semestre_display": nueva_asignatura.get_semestre_display(),
                "usar_docentes_area": usar_docentes_area,
                "docentes": docentes,
                "director_creador": nueva_asignatura.director_creador.correo,
                "subtipo_director": nueva_asignatura.subtipo_director
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    # GET: Listar todas las asignaturas o filtrar por parámetros
    elif request.method == "GET":
        
        try:
            
            # Obtener parámetros de filtrado
            area_id = request.GET.get('area')
            semestre = request.GET.get('semestre')
            docente_id = request.GET.get('docente')
            
            # Iniciar consulta base
            # Si es director, filtrar solo sus asignaturas
            if request.user.rol == "Director" and request.user.subtipo_director:
                asignaturas = Asignatura.objects.filter(subtipo_director=request.user.subtipo_director)
            else:
                asignaturas = Asignatura.objects.all()
            
            # Aplicar filtros si se proporcionan
            if area_id:
                try:
                    asignaturas = asignaturas.filter(area_id=int(area_id))
                except ValueError:
                    return JsonResponse({"mensaje": "ID de área inválido"}, status=400)
            
            if semestre:
                asignaturas = asignaturas.filter(semestre=semestre)
            
            if docente_id:
                try:
                    # Este filtrado debe considerar tanto los docentes propios como los del área
                    docente_id = int(docente_id)
                    # Crear una lista para almacenar las asignaturas que cumplen el criterio
                    asignaturas_filtradas = []
                    
                    for asignatura in asignaturas:
                        if asignatura.usar_docentes_area:
                            # Si la asignatura usa docentes del área, verificar si el docente pertenece al área
                            if asignatura.area.docentes.filter(id=docente_id).exists():
                                asignaturas_filtradas.append(asignatura.id)
                        else:
                            # Si usa docentes propios, verificar si el docente está en la asignatura
                            if asignatura.docentes.filter(id=docente_id).exists():
                                asignaturas_filtradas.append(asignatura.id)
                    
                    # Filtrar por los IDs encontrados
                    asignaturas = asignaturas.filter(id__in=asignaturas_filtradas)
                except ValueError:
                    return JsonResponse({"mensaje": "ID de docente inválido"}, status=400)
            
            # Formatear la respuesta
            resultado = []
            for asignatura in asignaturas:
                # Determinar el subtipo_docente correspondiente según el subtipo_director
                subtipo_docente_correspondiente = None
                if asignatura.subtipo_director == "Director de Ing.Sistemas":
                    subtipo_docente_correspondiente = "Docente de Ing.Sistemas"
                elif asignatura.subtipo_director == "Director de Ing.Electrónica":
                    subtipo_docente_correspondiente = "Docente de Ing.Electrónica"
                elif asignatura.subtipo_director == "Director de Ciencias Básicas":
                    subtipo_docente_correspondiente = "Docente de Ciencias Básicas"
                elif asignatura.subtipo_director == "Director de Humanidades":
                    subtipo_docente_correspondiente = "Docente de Humanidades"
                elif asignatura.subtipo_director == "Director de Idiomas":
                    subtipo_docente_correspondiente = "Docente de Idiomas"
                
                # Obtener los docentes correctos según el valor de usar_docentes_area y filtrar por subtipo correspondiente
                if asignatura.usar_docentes_area:
                    if subtipo_docente_correspondiente:
                        docentes_info = list(asignatura.area.docentes.filter(
                            rol="Docente", 
                            subtipo_docente=subtipo_docente_correspondiente
                        ).values('id', 'correo', 'subtipo_docente'))
                    else:
                        # Si es un administrador u otro caso, no filtramos por subtipo
                        docentes_info = list(asignatura.area.docentes.filter(
                            rol="Docente"
                        ).values('id', 'correo', 'subtipo_docente'))
                else:
                    if subtipo_docente_correspondiente:
                        docentes_info = list(asignatura.docentes.filter(
                            rol="Docente", 
                            subtipo_docente=subtipo_docente_correspondiente
                        ).values('id', 'correo', 'subtipo_docente'))
                    else:
                        # Si es un administrador u otro caso, no filtramos por subtipo
                        docentes_info = list(asignatura.docentes.filter(
                            rol="Docente"
                        ).values('id', 'correo', 'subtipo_docente'))
                
                resultado.append({
                    "id": asignatura.id,
                    "nombre": asignatura.nombre,
                    "area": {
                        "id": asignatura.area.id,
                        "nombre": asignatura.area.nombre
                    },
                    "semestre": asignatura.semestre,
                    "semestre_display": asignatura.get_semestre_display(),
                    "usar_docentes_area": asignatura.usar_docentes_area,
                    "docentes": docentes_info,
                    "director_creador": asignatura.director_creador.correo,
                    "subtipo_director": asignatura.subtipo_director
                })
            
            return JsonResponse({"asignaturas": resultado})
            
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def detalle_asignatura(request, asignatura_id):
    """Obtiene, actualiza o elimina una asignatura específica"""
    # Verificar autenticación y permisos
    if not request.user.is_authenticated:
        return JsonResponse({"mensaje": "No autorizado"}, status=401)
    
    # Solo administradores, directores y docentes pueden acceder al detalle
    if request.user.rol not in ["Administrador", "Director", "Docente"]:
        return JsonResponse({"mensaje": "No tiene permisos para gestionar asignaturas"}, status=403)
    
    try:
        asignatura = Asignatura.objects.get(id=asignatura_id)
        
        # Si es director, verificar que la asignatura pertenezca a su subtipo
        if (request.user.rol == "Director" and 
            request.user.subtipo_director and 
            asignatura.subtipo_director != request.user.subtipo_director):
            return JsonResponse({"mensaje": "No tiene acceso a esta asignatura"}, status=403)
            
    except ObjectDoesNotExist:
        return JsonResponse({"mensaje": "Asignatura no encontrada"}, status=404)
    
    # GET: Obtener detalle de una asignatura
    if request.method == "GET":
        # Obtener los docentes correctos según el valor de usar_docentes_area
        if asignatura.usar_docentes_area:
            # Filtrar para incluir solo usuarios que actualmente son docentes
            docentes_info = list(asignatura.area.docentes.filter(rol="Docente").values('id', 'correo', 'subtipo_docente'))
        else:
            # Filtrar para incluir solo usuarios que actualmente son docentes
            docentes_info = list(asignatura.docentes.filter(rol="Docente").values('id', 'correo', 'subtipo_docente'))
            
        data = {
            "id": asignatura.id,
            "nombre": asignatura.nombre,
            "area": {
                "id": asignatura.area.id,
                "nombre": asignatura.area.nombre
            },
            "semestre": asignatura.semestre,
            "semestre_display": asignatura.get_semestre_display(),
            "usar_docentes_area": asignatura.usar_docentes_area,
            "docentes": docentes_info,
            "director_creador": asignatura.director_creador.correo,
            "subtipo_director": asignatura.subtipo_director
        }
        return JsonResponse(data)
    
    # PUT: Actualizar una asignatura
    elif request.method == "PUT":
        # Verificar si el usuario puede editar (admin o el director creador con mismo subtipo)
        if not (request.user.rol == "Administrador" or 
                (request.user.rol == "Director" and 
                 request.user.id == asignatura.director_creador.id)):
            return JsonResponse({"mensaje": "No tiene permisos para editar esta asignatura"}, status=403)
        
        try:
            data = json.loads(request.body)
            
            # Actualizar nombre si se proporciona
            if "nombre" in data:
                asignatura.nombre = data["nombre"]
            
            # Actualizar área si se proporciona
            if "area" in data:
                area_nombre = data["area"]
                
                # Si es director, buscar área dentro de su subtipo
                if request.user.rol == "Director":
                    try:
                        area = Area.objects.get(
                            nombre=area_nombre, 
                            subtipo_director=request.user.subtipo_director
                        )
                    except ObjectDoesNotExist:
                        # Si el área no existe, crearla asociada al director actual
                        area = Area.objects.create(
                            nombre=area_nombre,
                            director_creador=request.user,
                            subtipo_director=request.user.subtipo_director
                        )
                else:
                    # Para administradores, buscar área por nombre
                    try:
                        area = Area.objects.get(nombre=area_nombre)
                    except ObjectDoesNotExist:
                        # Si es administrador, crear área asociada a sí mismo
                        area = Area.objects.create(
                            nombre=area_nombre,
                            director_creador=request.user,
                            subtipo_director="Administración"
                        )
                        
                asignatura.area = area
            
            # Actualizar semestre si se proporciona
            if "semestre" in data:
                # Validar que el semestre sea válido
                semestres_validos = [choice[0] for choice in Asignatura.SEMESTRES]
                if data["semestre"] not in semestres_validos:
                    return JsonResponse({
                        "mensaje": f"Semestre no válido. Opciones válidas: {', '.join(semestres_validos)}"
                    }, status=400)
                asignatura.semestre = data["semestre"]
            
            # Actualizar el campo usar_docentes_area si se proporciona
            if "usar_docentes_area" in data:
                asignatura.usar_docentes_area = bool(data["usar_docentes_area"])
            
            # Actualizar docentes específicos sólo si no se usan los docentes del área
            if not asignatura.usar_docentes_area and "docentes" in data and isinstance(data["docentes"], list):
                # Eliminar docentes actuales
                asignatura.docentes.clear()
                # Agregar nuevos docentes
                for correo_docente in data["docentes"]:
                    try:
                        docente = Usuario.objects.get(correo=correo_docente, rol="Docente")
                        asignatura.docentes.add(docente)
                    except ObjectDoesNotExist:
                        # No agregamos el docente si no existe o no es un docente
                        pass
            
            asignatura.save()
            return JsonResponse({"mensaje": "Asignatura actualizada exitosamente"})
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    # DELETE: Eliminar una asignatura
    elif request.method == "DELETE":
        # Solo administradores o el director creador con mismo subtipo pueden eliminar
        if not (request.user.rol == "Administrador" or 
                (request.user.rol == "Director" and 
                 request.user.id == asignatura.director_creador.id)):
            return JsonResponse({"mensaje": "No tiene permisos para eliminar esta asignatura"}, status=403)
        
        asignatura.delete()
        return JsonResponse({"mensaje": "Asignatura eliminada exitosamente"})
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

# Los métodos listar_areas y detalle_area permanecen casi igual, pero necesitamos
# añadir algunos cambios menores para mostrar las asignaturas correctamente

@csrf_exempt
def listar_areas(request):
    """Lista todas las áreas disponibles para las asignaturas"""
    
    # Verificar autenticación
    if not request.user.is_authenticated:
        return JsonResponse({"mensaje": "No autorizado"}, status=401)
    
    # Verificar que el método sea GET
    if request.method != "GET":
        return JsonResponse({"mensaje": "Método no permitido"}, status=405)
    
    try:
        # Si es director, mostrar solo áreas de su subtipo
        if request.user.rol == "Director" and request.user.subtipo_director:
            areas = Area.objects.filter(subtipo_director=request.user.subtipo_director).order_by('nombre')
        else:
            # Para administradores y otros roles, mostrar todas
            areas = Area.objects.all().order_by('nombre')
        
        # Formatear la respuesta
        resultado = []
        for area in areas:
            # Contar cuántas asignaturas tiene cada área
            num_asignaturas = area.asignaturas.count()
            
            # Determinar el subtipo_docente correspondiente según el subtipo_director
            subtipo_docente_correspondiente = None
            if area.subtipo_director == "Director de Ing.Sistemas":
                subtipo_docente_correspondiente = "Docente de Ing.Sistemas"    
            elif area.subtipo_director == "Director de Ing.Electrónica":
                subtipo_docente_correspondiente = "Docente de Ing.Electrónica"    
            elif area.subtipo_director == "Director de Ciencias Básicas":
                subtipo_docente_correspondiente = "Docente de Ciencias Básicas"
            elif area.subtipo_director == "Director de Humanidades":
                subtipo_docente_correspondiente = "Docente de Humanidades"
            elif area.subtipo_director == "Director de Idiomas":
                subtipo_docente_correspondiente = "Docente de Idiomas"
            
            # Filtrar para incluir solo usuarios que actualmente son docentes y del subtipo correspondiente
            if subtipo_docente_correspondiente:
                docentes_actuales = area.docentes.filter(
                    rol="Docente", 
                    subtipo_docente=subtipo_docente_correspondiente
                )
            else:
                # Si es administración u otro caso, no filtrar por subtipo
                docentes_actuales = area.docentes.filter(rol="Docente")
            
            resultado.append({
                "id": area.id,
                "nombre": area.nombre,
                "num_asignaturas": num_asignaturas,
                "director_creador": area.director_creador.correo,
                "subtipo_director": area.subtipo_director,
                # Incluir solo los docentes con rol actual "Docente" y del subtipo correspondiente
                "docentes": list(docentes_actuales.values('id', 'correo', 'subtipo_docente')),
                # Opcionalmente, puedes incluir las primeras N asignaturas del área
                "asignaturas_ejemplo": list(area.asignaturas.values('id', 'nombre')[:3])
            })
        
        return JsonResponse({"areas": resultado})
        
    except Exception as e:
        return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
@csrf_exempt
def detalle_area(request, area_id):
    """Obtiene, actualiza o elimina un área específica"""
    # Verificar autenticación y permisos
    if not request.user.is_authenticated:
        return JsonResponse({"mensaje": "No autorizado"}, status=401)
    
    # Solo administradores y directores pueden gestionar áreas
    if request.user.rol not in ["Administrador", "Director"]:
        return JsonResponse({"mensaje": "No tiene permisos para gestionar áreas"}, status=403)
    
    try:
        area = Area.objects.get(id=area_id)
        
        # Si es director, verificar que el área pertenece a su subtipo
        if (request.user.rol == "Director" and 
            request.user.subtipo_director and 
            area.subtipo_director != request.user.subtipo_director):
            return JsonResponse({"mensaje": "No tiene acceso a esta área"}, status=403)
            
    except ObjectDoesNotExist:
        return JsonResponse({"mensaje": "Área no encontrada"}, status=404)
    
    # GET: Obtener detalle de un área
    if request.method == "GET":
        # Contar asignaturas relacionadas
        num_asignaturas = area.asignaturas.count()
        
        data = {
            "id": area.id,
            "nombre": area.nombre,
            "director_creador": area.director_creador.correo,
            "subtipo_director": area.subtipo_director,
            "num_asignaturas": num_asignaturas,
            "docentes": list(area.docentes.values('id', 'correo', 'subtipo_docente')),
            "asignaturas": list(area.asignaturas.values('id', 'nombre', 'semestre', 'usar_docentes_area'))
        }
        return JsonResponse(data)
    
    # PUT: Actualizar un área
    elif request.method == "PUT":
        # Verificar si el usuario puede editar (admin o el director creador con mismo subtipo)
        if not (request.user.rol == "Administrador" or 
                (request.user.rol == "Director" and 
                 request.user.id == area.director_creador.id)):
            return JsonResponse({"mensaje": "No tiene permisos para editar esta área"}, status=403)
            
        try:
            data = json.loads(request.body)
            
            # Actualizar nombre si se proporciona
            if "nombre" in data:
                # Verificar si ya existe un área con ese nombre (en cualquier departamento)
                if Area.objects.filter(nombre=data["nombre"]).exclude(id=area_id).exists():
                    return JsonResponse({"mensaje": "Ya existe un área con ese nombre"}, status=400)
                
                area.nombre = data["nombre"]
            
            # Actualizar docentes si se proporcionan
            docentes_no_encontrados = []
            docentes_encontrados = []
            
            if "docentes" in data and isinstance(data["docentes"], list):
                # Validar que haya docentes asignados
                if len(data["docentes"]) == 0:
                    return JsonResponse({"mensaje": "Se requiere asignar al menos un docente al área"}, status=400)
                
                # Eliminar docentes actuales
                area.docentes.clear()
                
                # Agregar nuevos docentes
                for correo_docente in data["docentes"]:
                    try:
                        # Primero hacemos una búsqueda menos restrictiva, solo por correo
                        try:
                            docente = Usuario.objects.get(correo__iexact=correo_docente)
                            
                            # Verificamos que sea docente
                            if docente.rol != "Docente":
                                docentes_no_encontrados.append(f"{correo_docente} (no es un docente)")
                                continue
                                
                            # Si es director, verificamos que sea del mismo subtipo
                            if request.user.rol == "Director":
                                # Extrae el departamento (parte después de "Docente de" o "Director de")
                                departamento_docente = docente.subtipo_docente.replace("Docente de ", "").strip() 
                                departamento_director = request.user.subtipo_director.replace("Director de ", "").strip()
                                departamento_docente2 = docente.subtipo_docente.replace("Docente del ", "").strip() 
                                departamento_director2 = request.user.subtipo_director.replace("Director del ", "").strip()

                                # Compara solo los departamentos
                                if departamento_docente != departamento_director and departamento_docente2 != departamento_director2:
                                    docentes_no_encontrados.append(f"{correo_docente} (no es de tu departamento)")
                                    continue
                                
                            # Si pasó todas las validaciones, lo agregamos
                            area.docentes.add(docente)
                            docentes_encontrados.append(correo_docente)
                            
                        except ObjectDoesNotExist:
                            # No se encontró el correo
                            docentes_no_encontrados.append(correo_docente)
                            
                    except Exception as e:
                        # Error inesperado
                        docentes_no_encontrados.append(f"{correo_docente} (error: {str(e)})")
                
                # Verificar que al menos se haya agregado un docente
                if not docentes_encontrados:
                    return JsonResponse({
                        "mensaje": "No se pudo actualizar el área porque no se encontraron docentes válidos",
                        "docentes_no_encontrados": docentes_no_encontrados
                    }, status=400)
            
            area.save()
            
            response_data = {
                "mensaje": "Área actualizada exitosamente",
                "id": area.id,
                "nombre": area.nombre,
                "docentes": list(area.docentes.values('id', 'correo', 'subtipo_docente')),
                "docentes_encontrados": docentes_encontrados
            }
            
            # Si hubo docentes que no se pudieron agregar, notificarlo
            if docentes_no_encontrados:
                response_data["advertencia"] = f"No se encontraron los siguientes docentes: {', '.join(docentes_no_encontrados)}"
            
            return JsonResponse(response_data)
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    # DELETE: Eliminar un área
    elif request.method == "DELETE":
        # Solo administradores o el director creador con mismo subtipo pueden eliminar
        if not (request.user.rol == "Administrador" or 
                (request.user.rol == "Director" and 
                 request.user.id == area.director_creador.id)):
            return JsonResponse({"mensaje": "No tiene permisos para eliminar esta área"}, status=403)
            
        # Verificar si el área tiene asignaturas asociadas
        if area.asignaturas.exists():
            return JsonResponse({
                "mensaje": "No se puede eliminar el área porque tiene asignaturas asociadas",
                "num_asignaturas": area.asignaturas.count(),
                "asignaturas": list(area.asignaturas.values('id', 'nombre')[:5])  # Mostrar hasta 5 ejemplos
            }, status=400)
        
        area.delete()
        return JsonResponse({"mensaje": "Área eliminada exitosamente"})
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)

@csrf_exempt
def listar_docentes_por_subtipo(request):
    """Lista los docentes filtrados por el subtipo del director actual"""
    # Verificar autenticación
    if not request.user.is_authenticated:
        return JsonResponse({"mensaje": "No autorizado"}, status=401)
    
    # Verificar que el método sea GET
    if request.method != "GET":
        return JsonResponse({"mensaje": "Método no permitido"}, status=405)
    
    try:
        # Si es director, mostrar solo docentes de su mismo subtipo
        if request.user.rol == "Director" and request.user.subtipo_director:
            # Mapeo de subtipo_director a subtipo_docente
            subtipo_docente_correspondiente = request.user.subtipo_director
            
            # Si hay un mapeo específico (ej. "Director del Programa" -> "Docente del Programa")
            if request.user.subtipo_director == "Director de Ing.Sistemas":
                subtipo_docente_correspondiente = "Docente de Ing.Sistemas"  
            elif request.user.subtipo_director == "Director de Ing.Electrónica":
                subtipo_docente_correspondiente = "Docente de Ing.Electrónica"    
            elif request.user.subtipo_director == "Director de Humanidades":
                subtipo_docente_correspondiente = "Docente de Humanidades"
            elif request.user.subtipo_director == "Director de Ciencias Básicas":
                subtipo_docente_correspondiente = "Docente de Ciencias Básicas"
            elif request.user.subtipo_director == "Director de Idiomas":
                subtipo_docente_correspondiente = "Docente de Idiomas"
            # Añadir más mapeos según sea necesario
            
            docentes = Usuario.objects.filter(
                rol="Docente", 
                subtipo_docente=subtipo_docente_correspondiente
            ).order_by('nombre')
        else:
            # Para administradores y otros roles, mostrar todos los docentes
            docentes = Usuario.objects.filter(rol="Docente").order_by('nombre')
        
        resultado = list(docentes.values('id', 'nombre', 'correo', 'subtipo_docente'))
        return JsonResponse(resultado, safe=False)
        
    except Exception as e:
        return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)

# Esta función adicional puede ayudar a listar docentes por área
@csrf_exempt
def listar_docentes_por_area(request, area_id):
    """Lista los docentes asociados a un área específica"""
    # Verificar autenticación
    if not request.user.is_authenticated:
        return JsonResponse({"mensaje": "No autorizado"}, status=401)
    
    # Verificar que el método sea GET
    if request.method != "GET":
        return JsonResponse({"mensaje": "Método no permitido"}, status=405)
    
    try:
        # Obtener el área
        try:
            area = Area.objects.get(id=area_id)
            
            # Si es director, verificar que el área pertenece a su subtipo
            if (request.user.rol == "Director" and 
                request.user.subtipo_director and 
                area.subtipo_director != request.user.subtipo_director):
                return JsonResponse({"mensaje": "No tiene acceso a esta área"}, status=403)
                
        except ObjectDoesNotExist:
            return JsonResponse({"mensaje": "Área no encontrada"}, status=404)
        
        # Obtener los docentes del área
        docentes = area.docentes.all().order_by('nombre')
        resultado = list(docentes.values('id', 'nombre', 'correo', 'subtipo_docente'))
        
        return JsonResponse({
            "area": area.nombre,
            "docentes": resultado
        })
        
    except Exception as e:
        return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
@csrf_exempt
def gestionar_area(request):
    """Crea o lista áreas con sus docentes asociados"""
    
    # Verificar autenticación y permisos
    if not request.user.is_authenticated:
        return JsonResponse({"mensaje": "No autorizado"}, status=401)
    
    # Solo administradores y directores pueden gestionar áreas
    if request.user.rol not in ["Administrador", "Director"]:
        return JsonResponse({"mensaje": "No tiene permisos para gestionar áreas"}, status=403)
    
    # POST: Crear una nueva área
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            
            # Validar campos requeridos
            if "nombre" not in data:
                return JsonResponse({"mensaje": "El nombre del área es requerido"}, status=400)
                
            # Validar que haya docentes asignados
            if "docentes" not in data or not isinstance(data["docentes"], list) or len(data["docentes"]) == 0:
                return JsonResponse({"mensaje": "Se requiere asignar al menos un docente al área"}, status=400)
            
            # Verificar si ya existe un área con ese nombre (en cualquier departamento)
            if Area.objects.filter(nombre=data["nombre"]).exists():
                return JsonResponse({"mensaje": "Ya existe un área con ese nombre"}, status=400)
            
            # Crear el área
            nueva_area = Area(
                nombre=data["nombre"],
                director_creador=request.user,
                subtipo_director=request.user.subtipo_director if request.user.rol == "Director" else "Administración"
            )
            nueva_area.save()
            
            # Agregar docentes si se proporcionan
            docentes_no_encontrados = []
            docentes_encontrados = []
            
            for correo_docente in data["docentes"]:
                try:
                    # Primero hacemos una búsqueda menos restrictiva, solo por correo
                    try:
                        docente = Usuario.objects.get(correo__iexact=correo_docente)
                        
                        # Verificamos que sea docente
                        if docente.rol != "Docente":
                            docentes_no_encontrados.append(f"{correo_docente} (no es un docente)")
                            continue
                            
                        # Si es director, verificamos que sea del mismo subtipo
                        if request.user.rol == "Director":
                            # Extrae el departamento (parte después de "Docente de" o "Director de")
                            departamento_docente = docente.subtipo_docente.replace("Docente de ", "").strip() 
                            departamento_director = request.user.subtipo_director.replace("Director de ", "").strip()
                            departamento_docente2 = docente.subtipo_docente.replace("Docente del ", "").strip() 
                            departamento_director2 = request.user.subtipo_director.replace("Director del ", "").strip()

                            # Compara solo los departamentos
                            if departamento_docente != departamento_director and departamento_docente2 != departamento_director2:
                                docentes_no_encontrados.append(f"{correo_docente} (no es de tu departamento)")
                                continue
                            
                        # Si pasó todas las validaciones, lo agregamos
                        nueva_area.docentes.add(docente)
                        docentes_encontrados.append(correo_docente)
                        
                    except ObjectDoesNotExist:
                        # No se encontró el correo
                        docentes_no_encontrados.append(correo_docente)
                        
                except Exception as e:
                    # Error inesperado
                    docentes_no_encontrados.append(f"{correo_docente} (error: {str(e)})")
            
            # Verificar que al menos se haya agregado un docente
            if not docentes_encontrados:
                # Si no se agregó ningún docente, eliminamos el área creada
                nueva_area.delete()
                return JsonResponse({
                    "mensaje": "No se pudo crear el área porque no se encontraron docentes válidos",
                    "docentes_no_encontrados": docentes_no_encontrados
                }, status=400)
            
            response_data = {
                "mensaje": "Área creada exitosamente",
                "id": nueva_area.id,
                "nombre": nueva_area.nombre,
                "director_creador": nueva_area.director_creador.correo,
                "subtipo_director": nueva_area.subtipo_director,
                "docentes": list(nueva_area.docentes.values('id', 'correo', 'subtipo_docente')),
                "docentes_encontrados": docentes_encontrados
            }
            
            # Si hubo docentes que no se pudieron agregar, notificarlo
            if docentes_no_encontrados:
                response_data["advertencia"] = f"No se encontraron los siguientes docentes: {', '.join(docentes_no_encontrados)}"
            
            return JsonResponse(response_data, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({"mensaje": "Error en el formato de los datos"}, status=400)
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    # GET: Listar todas las áreas
    elif request.method == "GET":
        try:
            # Si es director, mostrar solo áreas de su subtipo
            if request.user.rol == "Director" and request.user.subtipo_director:
                areas = Area.objects.filter(subtipo_director=request.user.subtipo_director).order_by('nombre')
            else:
                # Para administradores y otros roles, mostrar todas
                areas = Area.objects.all().order_by('nombre')
            
            # Formatear la respuesta
            resultado = []
            for area in areas:
                # Determinar el subtipo_docente correspondiente según el subtipo_director
                subtipo_docente_correspondiente = None
                if area.subtipo_director == "Director de Ing.Sistemas":
                    subtipo_docente_correspondiente = "Docente de Ing.Sistemas"    
                elif area.subtipo_director == "Director de Ing.Electrónica":
                    subtipo_docente_correspondiente = "Docente de Ing.Electrónica"
                elif area.subtipo_director == "Director de Ciencias Básicas":
                    subtipo_docente_correspondiente = "Docente de Ciencias Básicas"
                elif area.subtipo_director == "Director de Humanidades":
                    subtipo_docente_correspondiente = "Docente de Humanidades"
                elif area.subtipo_director == "Director de Idiomas":
                    subtipo_docente_correspondiente = "Docente de Idiomas"
                
                # Filtrar los docentes por el subtipo correspondiente si aplica
                if subtipo_docente_correspondiente:
                    docentes_filtrados = area.docentes.filter(
                        rol="Docente", 
                        subtipo_docente=subtipo_docente_correspondiente
                    )
                else:
                    # Si es un administrador u otro caso, no filtramos por subtipo
                    docentes_filtrados = area.docentes.filter(rol="Docente")
                
                resultado.append({
                    "id": area.id,
                    "nombre": area.nombre,
                    "director_creador": area.director_creador.correo,
                    "subtipo_director": area.subtipo_director,
                    "num_asignaturas": area.asignaturas.count(),
                    "docentes": list(docentes_filtrados.values('id', 'correo', 'subtipo_docente'))
                })
            
            return JsonResponse({"areas": resultado})
            
        except Exception as e:
            return JsonResponse({"mensaje": f"Error: {str(e)}"}, status=500)
    
    return JsonResponse({"mensaje": "Método no permitido"}, status=405)