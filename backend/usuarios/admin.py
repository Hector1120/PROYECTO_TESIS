from django.contrib import admin
from .models import Usuario, Horario, BloqueHorario, Area, Asignatura

admin.site.register(Usuario)
admin.site.register(Horario)
admin.site.register(BloqueHorario)
admin.site.register(Area)
admin.site.register(Asignatura)