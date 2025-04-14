from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.conf import settings
from datetime import date

class UsuarioManager(BaseUserManager):
    def create_user(self, correo, password=None, **extra_fields):
        if not correo:
            raise ValueError("El usuario debe tener un correo electrónico")
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
    correo = models.EmailField(unique=True)
    rol = models.CharField(max_length=13, choices=ROLES, default="Estudiante")
    subtipo_director = models.CharField(max_length=50, blank=True, null=True)
    subtipo_docente = models.CharField(max_length=50, blank=True, null=True)  # Nuevo campo para tipo de docente
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    objects = UsuarioManager()
    USERNAME_FIELD = "correo"
    REQUIRED_FIELDS = ["rol"]
    
    def __str__(self):
        return f"{self.correo} ({self.rol})"

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

    class Meta:
        unique_together = ('horario', 'fecha', 'hora_inicio', 'hora_fin')

    def __str__(self):
        return f"{self.horario} - {self.fecha} {self.hora_inicio} a {self.hora_fin}"

class PermisoHorario(models.Model):
    horario = models.OneToOneField(Horario, on_delete=models.CASCADE)
    puede_editar = models.BooleanField(default=False)
    puede_eliminar = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = "Permiso de horario"
        verbose_name_plural = "Permisos de horarios"
    
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