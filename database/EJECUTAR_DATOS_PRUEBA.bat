@echo off
echo ============================================================
echo EJECUTAR DATOS DE PRUEBA EN MySQL
echo ============================================================
echo.
echo Este script insertará 6 tickets de prueba con historial completo
echo en la base de datos ticket_system
echo.
echo IMPORTANTE: Asegúrate de tener XAMPP MySQL ejecutándose
echo.
pause

echo.
echo Ejecutando script SQL...
echo.

"C:\xampp\mysql\bin\mysql.exe" -u root ticket_system < "%~dp0insert_datos_prueba_completos.sql"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Hubo un problema al ejecutar el script
    echo.
    echo Si MySQL requiere contraseña, ejecuta manualmente:
    echo "C:\xampp\mysql\bin\mysql.exe" -u root -p ticket_system
    echo.
    echo Y luego copia y pega el contenido de insert_datos_prueba_completos.sql
    echo.
) else (
    echo.
    echo [ÉXITO] Datos de prueba insertados correctamente
    echo.
)

echo.
pause
