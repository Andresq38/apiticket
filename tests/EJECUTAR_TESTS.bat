@echo off
REM ============================================================
REM EJECUTAR TESTS PHPUNIT - Sistema de Tickets
REM ============================================================

cd /d "%~dp0.."

echo.
echo ═══════════════════════════════════════════════════════════
echo    EJECUTANDO SUITE DE TESTS PHPUNIT
echo ═══════════════════════════════════════════════════════════
echo.

REM Verificar si PHPUnit está instalado
if exist "vendor\bin\phpunit.bat" (
    echo [✓] PHPUnit encontrado via Composer
    echo.
    echo Ejecutando tests...
    echo.
    vendor\bin\phpunit --verbose --testdox --colors=always
    goto END
)

if exist "phpunit.phar" (
    echo [✓] PHPUnit encontrado (PHAR)
    echo.
    echo Ejecutando tests...
    echo.
    php phpunit.phar --verbose --testdox --colors=always
    goto END
)

REM Si no está instalado, mostrar instrucciones
echo [✗] PHPUnit NO encontrado
echo.
echo Para instalar PHPUnit:
echo.
echo Opción 1: Via Composer (Recomendado)
echo   composer require --dev phpunit/phpunit
echo.
echo Opción 2: Descargar PHAR
echo   Invoke-WebRequest -Uri https://phar.phpunit.de/phpunit-9.phar -OutFile phpunit.phar
echo.
pause
exit /b 1

:END
echo.
echo ═══════════════════════════════════════════════════════════
echo    TESTS COMPLETADOS
echo ═══════════════════════════════════════════════════════════
echo.

REM Abrir reporte HTML si existe
if exist "tests\_output\testdox.html" (
    echo Abriendo reporte HTML...
    start tests\_output\testdox.html
)

pause
