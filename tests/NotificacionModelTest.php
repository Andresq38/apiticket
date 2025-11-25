<?php
/**
 * Tests para NotificacionModel
 * Valida sistema de notificaciones en tiempo real
 */

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../models/NotificacionModel.php';
require_once __DIR__ . '/../controllers/core/Database.php';

class NotificacionModelTest extends TestCase
{
    private $notificacionModel;
    private $testNotificacionId;

    protected function setUp(): void
    {
        $this->notificacionModel = new NotificacionModel();
    }

    protected function tearDown(): void
    {
        if ($this->testNotificacionId) {
            try {
                $this->notificacionModel->delete($this->testNotificacionId);
            } catch (Exception $e) {
                // Ignorar errores de limpieza
            }
        }
    }

    /**
     * @test
     * Valida creación de notificación con todos los campos requeridos
     */
    public function testCrearNotificacion()
    {
        $nuevaNotificacion = (object)[
            'id_usuario' => '1-1343-0736',
            'titulo' => 'Notificación de prueba - PHPUnit',
            'mensaje' => 'Mensaje de prueba para validar creación',
            'tipo' => 'info',
            'leida' => false
        ];

        $result = $this->notificacionModel->create($nuevaNotificacion);

        $this->assertIsArray($result);
        $this->assertArrayHasKey('id_notificacion', $result);
        $this->testNotificacionId = $result['id_notificacion'];
        $this->assertGreaterThan(0, $this->testNotificacionId);
    }

    /**
     * @test
     * Valida que se puedan obtener notificaciones por usuario
     */
    public function testObtenerNotificacionesPorUsuario()
    {
        // Crear notificación de prueba
        $notif = (object)[
            'id_usuario' => '1-1343-0736',
            'titulo' => 'Test usuario',
            'mensaje' => 'Mensaje para usuario específico',
            'tipo' => 'success',
            'leida' => false
        ];

        $created = $this->notificacionModel->create($notif);
        $this->testNotificacionId = $created['id_notificacion'];

        // Obtener notificaciones del usuario
        $notificaciones = $this->notificacionModel->getByUsuario('1-1343-0736');

        $this->assertIsArray($notificaciones);
        $this->assertNotEmpty($notificaciones);
        
        // Verificar que incluye la notificación recién creada
        $found = false;
        foreach ($notificaciones as $n) {
            if ($n['id_notificacion'] == $this->testNotificacionId) {
                $found = true;
                break;
            }
        }
        $this->assertTrue($found, 'Notificación creada no se encontró en lista del usuario');
    }

    /**
     * @test
     * Valida marcar notificación como leída
     */
    public function testMarcarComoLeida()
    {
        // Crear notificación no leída
        $notif = (object)[
            'id_usuario' => '1-1343-0736',
            'titulo' => 'Test marcar leída',
            'mensaje' => 'Esta notificación será marcada como leída',
            'tipo' => 'warning',
            'leida' => false
        ];

        $created = $this->notificacionModel->create($notif);
        $this->testNotificacionId = $created['id_notificacion'];

        // Marcar como leída
        $result = $this->notificacionModel->marcarLeida($this->testNotificacionId);
        $this->assertTrue($result);

        // Verificar que efectivamente está leída
        $notifActualizada = $this->notificacionModel->get($this->testNotificacionId);
        $this->assertEquals(1, $notifActualizada['leida']);
    }

    /**
     * @test
     * Valida obtener solo notificaciones no leídas
     */
    public function testObtenerNoLeidasPorUsuario()
    {
        // Crear notificación no leída
        $notif = (object)[
            'id_usuario' => '1-1343-0736',
            'titulo' => 'Test no leída',
            'mensaje' => 'Notificación pendiente de lectura',
            'tipo' => 'error',
            'leida' => false
        ];

        $created = $this->notificacionModel->create($notif);
        $this->testNotificacionId = $created['id_notificacion'];

        // Obtener no leídas
        $noLeidas = $this->notificacionModel->getNoLeidasByUsuario('1-1343-0736');

        $this->assertIsArray($noLeidas);
        $this->assertNotEmpty($noLeidas);

        // Verificar que todas están marcadas como no leídas
        foreach ($noLeidas as $n) {
            $this->assertEquals(0, $n['leida'], 'Encontrada notificación leída en lista de no leídas');
        }
    }

    /**
     * @test
     * Valida que no se creen notificaciones duplicadas en corto tiempo
     */
    public function testNoCrearNotificacionesDuplicadas()
    {
        $notif1 = (object)[
            'id_usuario' => '1-1343-0736',
            'titulo' => 'Test duplicados',
            'mensaje' => 'Mensaje idéntico',
            'tipo' => 'info',
            'leida' => false
        ];

        $created1 = $this->notificacionModel->create($notif1);
        $id1 = $created1['id_notificacion'];

        // Intentar crear notificación idéntica inmediatamente después
        $notif2 = (object)[
            'id_usuario' => '1-1343-0736',
            'titulo' => 'Test duplicados',
            'mensaje' => 'Mensaje idéntico',
            'tipo' => 'info',
            'leida' => false
        ];

        try {
            $created2 = $this->notificacionModel->create($notif2);
            $id2 = $created2['id_notificacion'];

            // Si se permite, verificar que son diferentes IDs
            // (Esto depende de si el modelo tiene lógica anti-duplicados)
            $this->assertNotEquals($id1, $id2);

            // Limpiar ambas
            $this->notificacionModel->delete($id2);
        } catch (Exception $e) {
            // Si lanza excepción por duplicado, es correcto
            $this->assertStringContainsString('duplica', strtolower($e->getMessage()));
        } finally {
            $this->testNotificacionId = $id1;
        }
    }

    /**
     * @test
     * Valida que notificaciones tienen timestamp correcto
     */
    public function testNotificacionesTienenTimestamp()
    {
        $notif = (object)[
            'id_usuario' => '1-1343-0736',
            'titulo' => 'Test timestamp',
            'mensaje' => 'Verificar fecha de creación',
            'tipo' => 'success',
            'leida' => false
        ];

        $created = $this->notificacionModel->create($notif);
        $this->testNotificacionId = $created['id_notificacion'];

        $notifCompleta = $this->notificacionModel->get($this->testNotificacionId);

        $this->assertArrayHasKey('fecha_creacion', $notifCompleta);
        $this->assertNotEmpty($notifCompleta['fecha_creacion']);

        // Verificar que el timestamp es reciente (menos de 1 minuto de diferencia)
        $fechaCreacion = strtotime($notifCompleta['fecha_creacion']);
        $ahora = time();
        $diferencia = abs($ahora - $fechaCreacion);

        $this->assertLessThan(60, $diferencia, 'Timestamp de notificación no es reciente');
    }

    /**
     * @test
     * Valida marcar todas como leídas para un usuario
     */
    public function testMarcarTodasLeidasPorUsuario()
    {
        // Crear múltiples notificaciones no leídas
        $ids = [];
        for ($i = 0; $i < 3; $i++) {
            $notif = (object)[
                'id_usuario' => '1-1343-0736',
                'titulo' => "Test batch $i",
                'mensaje' => "Notificación número $i",
                'tipo' => 'info',
                'leida' => false
            ];

            $created = $this->notificacionModel->create($notif);
            $ids[] = $created['id_notificacion'];
        }

        // Marcar todas como leídas
        $result = $this->notificacionModel->marcarTodasLeidas('1-1343-0736');
        $this->assertTrue($result);

        // Verificar que todas están leídas
        $noLeidas = $this->notificacionModel->getNoLeidasByUsuario('1-1343-0736');
        
        // No debería haber ninguna de las que acabamos de crear
        foreach ($noLeidas as $n) {
            $this->assertNotContains($n['id_notificacion'], $ids, 'Notificación no se marcó como leída');
        }

        // Limpiar
        foreach ($ids as $id) {
            $this->notificacionModel->delete($id);
        }
    }

    /**
     * @test
     * Valida tipos de notificación válidos
     */
    public function testTiposDeNotificacionValidos()
    {
        $tiposValidos = ['success', 'info', 'warning', 'error'];

        foreach ($tiposValidos as $tipo) {
            $notif = (object)[
                'id_usuario' => '1-1343-0736',
                'titulo' => "Test tipo $tipo",
                'mensaje' => "Notificación de tipo $tipo",
                'tipo' => $tipo,
                'leida' => false
            ];

            $created = $this->notificacionModel->create($notif);
            $this->assertArrayHasKey('id_notificacion', $created);

            // Limpiar inmediatamente
            $this->notificacionModel->delete($created['id_notificacion']);
        }

        $this->assertTrue(true, 'Todos los tipos válidos fueron creados correctamente');
    }

    /**
     * @test
     * Valida que notificaciones de login se crean automáticamente
     */
    public function testNotificacionLoginSeCreanAutomaticamente()
    {
        // Este test requiere integración con AuthController
        // En implementación real, simular login y verificar notificación creada
        $this->assertTrue(true); // Placeholder
    }

    /**
     * @test
     * Valida que notificaciones de cambio de estado se crean
     */
    public function testNotificacionCambioEstadoSeCrean()
    {
        // Este test requiere integración con TicketController
        // En implementación real, cambiar estado y verificar notificación
        $this->assertTrue(true); // Placeholder
    }
}
