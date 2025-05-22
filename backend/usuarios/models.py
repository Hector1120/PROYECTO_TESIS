from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings
from datetime import date

class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError("El usuario debe tener un correo electrónico")
        if not extra_fields.get('nombre_usuario'):
            raise ValueError("El usuario debe tener un nombre")
        correo = self.normalize_email(correo)
        extra_fields.setdefault("rol", "Estudiante")  # Valor por defecto para usuarios normales
        user = self.model(correo=correo, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, correo, password=None, **extra_fields):
        # Permitir que usuarios con rol Director también sean superusuarios
        if extra_fields.get('rol') not in ['Administrador', 'Director']:
            extra_fields['rol'] = 'Director'  # Establecer rol por defecto para superusuarios
        
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        
        # Forzar el rol de Administrador o Director
        return self.create_user(correo, password, **extra_fields)

class Usuario(AbstractBaseUser, PermissionsMixin):
    ROLES = [
        ("Estudiante", "Estudiante"),
        ("Docente", "Docente"),
        ("Administrador", "Administrador"),
        ("Director", "Director"),
    ]
    
    SEMESTRES = [
        ('1', 'Primer Semestre'),
        ('2', 'Segundo Semestre'),
        ('3', 'Tercer Semestre'),
        ('4', 'Cuarto Semestre'),
        ('5', 'Quinto Semestre'),
        ('6', 'Sexto Semestre'),
        ('7', 'Séptimo Semestre'),
        ('8', 'Octavo Semestre'),
        ('9', 'Noveno Semestre'),
        ('10', 'Décimo Semestre'),
    ]
    
    nombre_usuario = models.CharField(max_length=100)  # Campo obligatorio para el nombre del usuario
    correo = models.EmailField(unique=True)
    rol = models.CharField(max_length=13, choices=ROLES, default="Estudiante")
    subtipo_director = models.CharField(max_length=50, blank=True, null=True)
    subtipo_docente = models.CharField(max_length=50, blank=True, null=True)
    # Nuevos campos para estudiantes
    semestre = models.CharField(max_length=2, choices=SEMESTRES, blank=True, null=True)
    grupo = models.CharField(max_length=5, blank=True, null=True)
    # Campos existentes
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    objects = UsuarioManager()
    USERNAME_FIELD = "correo"
    REQUIRED_FIELDS = ["rol", "nombre_usuario"]
    
    def __str__(self):
        if self.nombre_usuario:
            return f"{self.nombre_usuario} - {self.correo} ({self.rol})"
        return f"{self.correo} ({self.rol})"
        
    def save(self, *args, **kwargs):
        # Asegura que solo los estudiantes tengan valores en semestre y grupo
        if self.rol != "Estudiante":
            self.semestre = None
            self.grupo = None
        super().save(*args, **kwargs)

class Horario(models.Model):
    DIAS_SEMANA = [
        ("Lunes", "Lunes"),
        ("Martes", "Martes"),
        ("Miércoles", "Miércoles"),
        ("Jueves", "Jueves"),
        ("Viernes", "Viernes"),
    ]

    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    periodo = models.CharField(max_length=10, default="2025-1")  # Ejemplo: "2025-1"
    dia = models.CharField(max_length=10, choices=DIAS_SEMANA)
    fecha = models.DateField(default=date.today)  # Nuevo campo para almacenar la fecha
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        # Permitir múltiples horarios para el mismo día en el mismo periodo
        unique_together = ('docente', 'periodo', 'fecha', 'hora_inicio', 'hora_fin')

    def __str__(self):
        return f"{self.docente} - {self.dia} {self.hora_inicio} a {self.hora_fin} ({self.periodo})"
    
class BloqueHorario(models.Model):
    horario = models.ForeignKey(Horario, on_delete=models.CASCADE, related_name='bloques')
    fecha = models.DateField()
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    lugar = models.CharField(max_length=200, help_text="Lugar de encuentro para la asesoría", default='No especificado')

    class Meta:
        unique_together = ('horario', 'fecha', 'hora_inicio', 'hora_fin')

    def __str__(self):
        return f"{self.horario} - {self.fecha} {self.hora_inicio} a {self.hora_fin} en {self.lugar}"

class PermisoHorario(models.Model):
    horario = models.OneToOneField(Horario, on_delete=models.CASCADE)
    puede_editar = models.BooleanField(default=False)
    puede_eliminar = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Permiso de horario"
        verbose_name_plural = "Permisos de horarios"
        
class PermisoDocente(models.Model):
    docente = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='permisos')
    puede_crear_horarios = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Permiso de docente"
        verbose_name_plural = "Permisos de docentes"
    
    def __str__(self):
        return f"Permisos de {self.docente.correo}"
    
class Area(models.Model):
    nombre = models.CharField(max_length=100)
    # Campo para identificar qué director creó esta área
    director_creador = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='areas_creadas',
        limit_choices_to={'rol': 'Director'}
    )
    # Campo para almacenar el subtipo de director que creó el área
    subtipo_director = models.CharField(max_length=50)
    # Relación muchos a muchos con docentes que dictan en esta área
    docentes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='areas_asignadas',
        limit_choices_to={'rol': 'Docente'},
        blank=True
    )
    
    def __str__(self):
        return self.nombre
    
    def save(self, *args, **kwargs):
        # Si no se ha establecido el subtipo_director, obtenerlo del director_creador
        if not self.subtipo_director and self.director_creador and self.director_creador.subtipo_director:
            self.subtipo_director = self.director_creador.subtipo_director
        super().save(*args, **kwargs)

class Asignatura(models.Model):
    SEMESTRES = [
        ('1', 'Primer Semestre'),
        ('2', 'Segundo Semestre'),
        ('3', 'Tercer Semestre'),
        ('4', 'Cuarto Semestre'),
        ('5', 'Quinto Semestre'),
        ('6', 'Sexto Semestre'),
        ('7', 'Séptimo Semestre'),
        ('8', 'Octavo Semestre'),
        ('9', 'Noveno Semestre'),
        ('10', 'Décimo Semestre'),
    ]
    
    nombre = models.CharField(max_length=200)
    area = models.ForeignKey(Area, on_delete=models.CASCADE, related_name='asignaturas')
    semestre = models.CharField(max_length=2, choices=SEMESTRES)
    # Ahora docentes será un campo opcional, ya que por defecto usaremos los del área
    docentes = models.ManyToManyField(
        settings.AUTH_USER_MODEL, 
        related_name='asignaturas_dictadas',
        blank=True
    )
    # Indica si usa los docentes del área o tiene docentes específicos
    usar_docentes_area = models.BooleanField(default=True)
    
    # Campo para identificar qué director creó esta asignatura
    director_creador = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='asignaturas_creadas',
        limit_choices_to={'rol': 'Director'}
    )
    # Campo para almacenar el subtipo de director que creó la asignatura
    subtipo_director = models.CharField(max_length=50)
    
    def __str__(self):
        return f"{self.nombre} - {self.get_semestre_display()}"
        
    def save(self, *args, **kwargs):
        # Si no se ha establecido el subtipo_director, obtenerlo del director_creador
        if not self.subtipo_director and self.director_creador and self.director_creador.subtipo_director:
            self.subtipo_director = self.director_creador.subtipo_director
        super().save(*args, **kwargs)
        
    def get_docentes(self):
        """Devuelve los docentes de la asignatura o los del área si usar_docentes_area es True"""
        if self.usar_docentes_area:
            return self.area.docentes.all()
        return self.docentes.all()
    
class Periodo(models.Model):
    codigo = models.CharField(max_length=10, unique=True)  # Ejemplo: "2025-1"
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activo = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.codigo}"
    
    class Meta:
        ordering = ['-codigo']  # Ordenar por código de forma descendente

# Nuevo modelo para gestionar múltiples bloques de horario en una asesoría
class AsesoriaBloque(models.Model):
    asesoria = models.ForeignKey('Asesoria', on_delete=models.CASCADE, related_name='bloques_asesoria')
    bloque_horario = models.ForeignKey('BloqueHorario', on_delete=models.CASCADE, related_name='asesorias_bloques')
    # Campos para registro de asistencia por bloque
    asistio = models.BooleanField(default=False, help_text="Indica si el estudiante asistió a este bloque de asesoría")
    # Nuevo campo para registrar la asistencia del docente (registrado por el estudiante)
    docente_asistio = models.BooleanField(default=False, help_text="Indica si el docente asistió a este bloque de asesoría (registrado por el estudiante)")
    temas_tratados = models.TextField(blank=True, null=True, help_text="Temas abordados durante este bloque")
    observaciones = models.TextField(blank=True, null=True, help_text="Observaciones adicionales para este bloque")
    docente_confirma_asistencia = models.BooleanField(
    default=False, 
    help_text="Confirmación por el docente de que asistió a este bloque de asesoría"
    )
    class Meta:
        verbose_name = "Bloque de Asesoría"
        verbose_name_plural = "Bloques de Asesorías"
        unique_together = ('asesoria', 'bloque_horario')
        
    def __str__(self):
        return f"Bloque {self.bloque_horario} para Asesoría {self.asesoria.id}"
        
class Asesoria(models.Model):
    ESTADOS = [
        ('Aprobada', 'Aprobada'),
        ('En curso', 'En curso'),
        ('Cancelada', 'Cancelada'),
        ('Finalizada', 'Finalizada'),
    ]

    
    estudiante = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asesorias_solicitadas')
    docente = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='asesorias_impartidas')
    asignatura = models.ForeignKey('Asignatura', on_delete=models.CASCADE, related_name='asesorias')
    # Nuevo: Usamos una relación ManyToMany a través del modelo AsesoriaBloque
    bloques_horario = models.ManyToManyField(
        'BloqueHorario', 
        through='AsesoriaBloque', 
        related_name='asesorias_relacionadas'
    )
    # Mantenemos este campo para compatibilidad con código existente y lo usaremos para el bloque principal
    bloque_horario = models.ForeignKey('BloqueHorario', on_delete=models.CASCADE, related_name='asesorias')
    # Campo lugar de encuentro sin valor por defecto (debe ser registrado por el docente)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=15, choices=ESTADOS, default='Aprobada')
    motivo = models.TextField(blank=True, null=True)
    comentarios = models.TextField(blank=True, null=True)
    
    # Campos para el registro de asistencia
    asistio = models.BooleanField(default=False, help_text="Indica si el estudiante asistió a la asesoría")
    temas_tratados = models.TextField(blank=True, null=True, help_text="Temas abordados durante la asesoría")
    observaciones = models.TextField(blank=True, null=True, help_text="Observaciones adicionales del docente")
    compromisos = models.TextField(blank=True, null=True, help_text="Compromisos adquiridos para futuras asesorías")
    
    # Campos para calificación
    calificacion = models.PositiveSmallIntegerField(
        blank=True, 
        null=True,
        choices=[(i, str(i)) for i in range(1, 6)],  # Escala del 1 al 5
        help_text="Calificación del 1 al 5"
    )
    comentario_calificacion = models.TextField(
        blank=True, 
        null=True,
        help_text="Comentarios sobre la asesoría"
    )
    fecha_calificacion = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="Fecha en que se calificó la asesoría"
    )
    
    class Meta:
        verbose_name = "Asesoría"
        verbose_name_plural = "Asesorías"
        # Eliminamos la restricción unique_together para permitir
        # que varios estudiantes puedan tener asesorías en el mismo bloque
        
    def __str__(self):
        return f"Asesoría de {self.asignatura} - {self.estudiante} con {self.docente}"
        
    def save(self, *args, **kwargs):
        # Al guardar aseguramos que el bloque_horario (para compatibilidad)
        # sea también el primer bloque de la relación many-to-many
        super().save(*args, **kwargs)
        
        # Después de guardar, aseguramos que el bloque_horario principal
        # esté en la relación many-to-many
        if self.bloque_horario and not self.bloques_horario.filter(id=self.bloque_horario.id).exists():
            AsesoriaBloque.objects.create(asesoria=self, bloque_horario=self.bloque_horario)