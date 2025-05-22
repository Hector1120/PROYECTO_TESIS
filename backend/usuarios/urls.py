# backend/usuarios/urls.py
from django.urls import path
from .views import (
    enviar_correo, login_usuario, recuperar_contraseña, verificar_sesion, 
    logout_usuario, registrar_horario, limpiar_horarios_endpoint, 
    obtener_horarios, listar_usuarios, crear_usuario, detalle_usuario, obtener_perfil_usuario,
    cambiar_contraseña, crear_estudiante, listar_estudiantes, detalle_estudiante,
    crear_docente, listar_docentes, detalle_docente, gestionar_asignatura,
    detalle_asignatura, listar_areas, detalle_area, listar_docentes_por_subtipo,
    listar_docentes_por_area, gestionar_area, obtener_horarios_docentes,
    actualizar_permisos_horario, verificar_permisos_horario, editar_horario,
    eliminar_horario, obtener_asignaturas_docente, crear_periodo, listar_periodos,detalle_periodo,
    periodo_vigente,verificar_permiso_crear_horarios, actualizar_permisos_docente,
    obtener_asignaturas_por_semestre, obtener_docentes_por_asignatura, obtener_horarios_disponibles,
    solicitar_asesoria, mis_asesorias, cancelar_asesoria, asesorias_programadas_docente, calificar_asesoria,
    asesorias_finalizadas_docente, registrar_asistencia_asesoria, historial_asesorias, exportar_historial_asesorias,
    obtener_asesoria, registrar_asistencia_docente, generar_reporte_asesoria_docente, listar_docentes_para_reportes,
    get_periodos, generar_reporte_asesoria_propio
    
    
    
)

urlpatterns = [
    path('enviar-correo/', enviar_correo, name="enviar_correo"),
    path("login/", login_usuario, name="login_usuario"),
    path("logout/", logout_usuario, name="logout_usuario"),
    path("verificar-sesion/", verificar_sesion, name="verificar_sesion"),
    path("recuperar-contraseña/", recuperar_contraseña, name="recuperar_contraseña"),
    
    path("registrar-horario/", registrar_horario, name="registrar_horario"),
    path('verificar-permiso-crear-horarios/', verificar_permiso_crear_horarios, name='verificar_permiso_crear_horarios'),
    path('actualizar-permisos-docente/', actualizar_permisos_docente, name='actualizar_permisos_docente'),
    path("limpiar-horarios/", limpiar_horarios_endpoint, name="limpiar_horarios"),
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
    
    path('obtener-asignaturas-docente/', obtener_asignaturas_docente, name='obtener_asignaturas_docente'),
    path('crear-periodo/', crear_periodo, name='crear_periodo'),
    path('listar-periodos/', listar_periodos, name='listar_periodos'),
    path('detalle-periodo/<int:periodo_id>/', detalle_periodo, name='detalle_periodo'),
    path('periodo-vigente/', periodo_vigente, name='periodo_vigente'),
    
    #Asesoría
    path('obtener-asignaturas-por-semestre/', obtener_asignaturas_por_semestre, name='obtener_asignaturas_por_semestre'),
    path('obtener-docentes-por-asignatura/<int:asignatura_id>/', obtener_docentes_por_asignatura, name='obtener_docentes_por_asignatura'),
    path('obtener-horarios-disponibles/<int:docente_id>/', obtener_horarios_disponibles, name='obtener_horarios_disponibles'),
    path('solicitar-asesoria/', solicitar_asesoria, name='solicitar_asesoria'),
    path('mis-asesorias/', mis_asesorias, name='mis_asesorias'),
    path('cancelar-asesoria/<int:asesoria_id>/', cancelar_asesoria, name='cancelar_asesoria'),
    path('asesorias-programadas-docente/', asesorias_programadas_docente, name='asesorias_programas_docente'),
    path('calificar-asesoria/<int:asesoria_id>/', calificar_asesoria, name='calificar_asesoria'),
    path('registrar-asistencia-asesoria/<int:asesoria_id>/', registrar_asistencia_asesoria, name='registrar_asistencia_asesoria'),
    path('asesorias-finalizadas-docente/', asesorias_finalizadas_docente, name='asesorias_finalizadas_docente'),
    path('exportar-historial-asesorias/', exportar_historial_asesorias, name='exportar_historial_asesorias'),
    path('historial-asesorias/', historial_asesorias, name='historial_asesorias'),
    path('obtener-asesoria/<int:asesoria_id>/', obtener_asesoria, name='obtener_asesoria'),
    path('registrar-asistencia-docente/<int:asesoria_id>/', registrar_asistencia_docente, name='registrar_asistencia_docente'),
    path('generar-reporte-asesoria-docente/<int:docente_id>/', generar_reporte_asesoria_docente, name='generar_reporte_asesoria_docente'),
    path('listar-docentes-para-reportes/', listar_docentes_para_reportes, name='listar_docentes_para_reportes'),
    path('get-periodos/', get_periodos, name='get_periodos'),
    path('generar-reporte-asesoria-propio/', generar_reporte_asesoria_propio, name='generar_reporte_asesoria_propio'),

]