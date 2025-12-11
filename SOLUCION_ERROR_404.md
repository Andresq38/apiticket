# Solución al error "Class Filename\HTTP\API not found"

Este error indica un problema con el autoloader de Composer o caché de PHP.

## Pasos de solución (en orden):

### 1. Regenerar autoloader de Composer
```powershell
cd C:\xampp\htdocs\apiticket
composer dump-autoload
```

### 2. Reiniciar Apache completamente
- Abrir XAMPP Control Panel
- Stop Apache
- Esperar 5 segundos
- Start Apache

### 3. Si persiste: Reinstalar dependencias
```powershell
cd C:\xampp\htdocs\apiticket
rm -r vendor
composer install
```

### 4. Verificar extensiones de PHP
Abrir `C:\xampp\php\php.ini` y verificar que estén habilitadas:
```ini
extension=openssl
extension=mbstring
extension=mysqli
extension=pdo_mysql
```
(Quitar el `;` al inicio si están comentadas)

### 5. Limpiar caché de opcache (si está habilitado)
En `php.ini`, temporalmente deshabilitar opcache:
```ini
opcache.enable=0
```
Reiniciar Apache después del cambio.

### 6. Probar nuevamente
Abrir: http://localhost:81/apiticket/test-login.html

---

## Si nada funciona:

### Opción A: Usar puerto 80 (más estable)
1. En XAMPP, configurar Apache para puerto 80
2. En `.env` del frontend: `VITE_API_BASE=http://localhost`
3. Reiniciar Apache y Vite

### Opción B: Verificar que no hay conflicto de versiones de PHP
```powershell
php -v
```
Debe mostrar PHP 7.4+ o 8.x

---

## Verificación rápida:
Después de cada paso, probar:
```
http://localhost:81/apiticket/auth/status
```
Debe responder: `{"status":"ok", ...}`
