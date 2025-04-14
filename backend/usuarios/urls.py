# backend/usuarios/urls.py
from django.urls import path
from .views import (
    enviar_correo, login_usuario, recuperar_contraseña, verificar_sesion, 
    logout_usuario, registrar_horario, eliminar_horarios_pasados_endpoint, 
    obtener_horarios, listar_usuarios, crear_usuario, detalle_usuario, obtener_perfil_usuario,
    cambiar_contraseña, crear_estudiante, listar_estudiantes, detalle_estudiante,
    crear_docente, listar_docentes, detalle_docente, gestionar_asignatura,
    detalle_asignatura, listar_areas, detalle_area, listar_docentes_por_subtipo,
    listar_docentes_por_area, gestionar_area, obtener_horarios_docentes,
    actualizar_permisos_horario, verificar_permisos_horario, editar_horario,
    eliminar_horario
)

urlpatterns = [
    path('enviar-correo/', enviar_correo, name="enviar_correo"),
    path("login/", login_usuario, name="login_usuario"),
    path("logout/", logout_usuario, name="logout_usuario"),
    path("verificar-sesion/", verificar_sesion, name="verificar_sesion"),
    path("recuperar-contraseña/", recuperar_contraseña, name="recuperar_contraseña"),
    
    path("registrar-horario/", registrar_horario, name="registrar_horario"),
    path("eliminar-horarios-pasados/", eliminar_horarios_pasados_endpoint, name="eliminar_horarios_pasados"),
    path('obtener-horarios/', obtener_horarios, name='obtener_horarios'),
    path('obtener-horarios-docentes/', obtener_horarios_docentes, name='obtener_horarios_docentes'),
    path('actualizar-permisos-horario/', actualizar_permisos_horario, name='actualizar_permisos_horario'),
    path('verificar-permisos-horario/<int:horario_id>/', verificar_permisos_horario, name='verificar_permisos_horario'),
    path('editar-horario/', editar_horario, name='editar_horario,'),
    path('eliminar-horario/', eliminar_horario, name='eliminar_horario'),
    
    # Nuevas rutas para la gestión de usuarios
    path('usuarios/', listar_usuarios, name='listar_usuarios'),
    path('crear-usuario/', crear_usuario, name='crear_usuario'),  # Misma ruta, diferente método (POST)
    path('usuarios/<int:usuario_id>/', detalle_usuario, name='detalle_usuario'),
    
    path('obtener-perfil-usuario/', obtener_perfil_usuario, name='obtener_perfil_usuario'),
    path('cambiar-contraseña/', cambiar_contraseña, name='cambiar_contraseña'),
    
    path('crear-estudiante/', crear_estudiante, name='crear_estudiante'),
    path('listar-estudiantes/', listar_estudiantes, name='listar_estudiantes'),
    path('detalle-estudiante/<int:estudiante_id>/', detalle_estudiante, name='detalle_estudiante'),
    
    path('crear-docente/', crear_docente, name='crear_docente'),
    path('listar-docentes/', listar_docentes, name='listar_docentes'),
    path('detalle-docente/<int:docente_id>/', detalle_docente, name='detalle_docente'),
    
    path('gestionar-asignatura/', gestionar_asignatura, name='gestionar_asignatura'),
    path('detalle-asignatura/<int:asignatura_id>/', detalle_asignatura, name='detalle_asignatura'),
    path('listar-areas/', listar_areas, name='listar_areas'),
    path('listar-docentes-por-subitpo/', listar_docentes_por_subtipo, name='listar_docentes_por_subtipo'),
    path('listar-docentes-por-area/<int:area_id>/', listar_docentes_por_area, name='listar_docentes_por_area'),
    path('detalle-area/<int:area_id>/', detalle_area, name='detalle_area'),
    path('gestionar-area/', gestionar_area, name='gestionar_area'),
]