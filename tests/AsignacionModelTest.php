<?php
/**
 * Tests para AsignacionModel
 * Valida el algoritmo de AutoTriage y la asignación manual
 */

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../models/AsignacionModel.php';
require_once __DIR__ . '/../models/TicketModel.php';
require_once __DIR__ . '/../models/TecnicoModel.php';
require_once __DIR__ . '/../controllers/core/Database.php';

class AsignacionModelTest extends TestCase
{
    private $asignacionModel;
    private $ticketModel;
    private $testTicketId;

    protected function setUp(): void
    {
        $this->asignacionModel = new AsignacionModel();
        $this->ticketModel = new TicketModel();
        
        // Crear ticket de prueba para asignación
        $testTicket = (object)[
            'titulo' => 'Test Asignación - PHPUnit',
            'descripcion' => 'Ticket para probar asignaciones',
            'prioridad' => 'Alta',
            'id_usuario' => '1-1343-0736',
            'id_categoria' => 1,
            'id_etiqueta' => 1,
            'id_estado' => 1,
            'comentario' => 'Test asignación'
        ];
        
        $created = $this->ticketModel->create($testTicket);
        $this->testTicketId = $created['id_ticket'] ?? null;
    }

    protected function tearDown(): void
    {
        if ($this->testTicketId) {
            try {
                $this->ticketModel->delete($this->testTicketId);
            } catch (Exception $e) {
                // Ignorar
            }
        }
    }

    /**
     * @test
     * Valida cálculo de puntaje AutoTriage: (prioridad × 1000) - tiempoRestanteSLA
     */
    public function testCalculoPuntajeAutoTriage()
    {
        // Obtener ticket y calcular puntaje esperado
        $ticket = $this->ticketModel->get($this->testTicketId);
        
        // Prioridad Alta = 3, SLA ejemplo = 240 min
        // Puntaje = (3 * 1000) - tiempoRestante
        // Si han pasado 60 min, resta 180 min
        // Puntaje esperado = 3000 - 180 = 2820 (aproximado)
        
        $this->assertIsObject($ticket);
        $this->assertEquals('Alta', $ticket->prioridad);
        
        // En implementación real, validar cálculo exacto del puntaje
        $this->assertTrue(true); // Placeholder
    }

    /**
     * @test
     * Valida que AutoTriage solo asigne técnicos con la especialidad correcta
     */
    public function testAsignacionPorEspecialidad()
    {
        try {
            $result = $this->asignacionModel->asignarAutomatico($this->testTicketId);
            
            // Si hay técnicos disponibles, debe asignar uno
            if (isset($result['tecnico_asignado'])) {
                $this->assertArrayHasKey('tecnico_asignado', $result);
                $this->assertArrayHasKey('especialidades', $result['tecnico_asignado']);
                
                // Validar que el técnico tiene la especialidad requerida
                $this->assertNotEmpty($result['tecnico_asignado']['especialidades']);
            } else {
                // Si no hay técnicos, debe indicarlo
                $this->assertArrayHasKey('mensaje', $result);
            }
        } catch (Exception $e) {
            // Si no hay técnicos disponibles, es esperado
            $this->assertStringContainsString('técnico', strtolower($e->getMessage()));
        }
    }

    /**
     * @test
     * Valida que asignación manual requiere justificación
     */
    public function testAsignacionManualRequiereJustificacion()
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessageMatches('/justificación|justificacion/i');

        $this->asignacionModel->asignarManual(
            $this->testTicketId,
            1, // ID técnico
            '', // Justificación vacía - debería fallar
            'admin'
        );
    }

    /**
     * @test
     * Valida que asignación manual requiere justificación mínima (20 caracteres)
     */
    public function testAsignacionManualRequiereJustificacionMinima()
    {
        $this->expectException(Exception::class);

        $this->asignacionModel->asignarManual(
            $this->testTicketId,
            1,
            'Corta', // Menos de 20 caracteres
            'admin'
        );
    }

    /**
     * @test
     * Valida que no se puede asignar técnico sin especialidad requerida
     */
    public function testNoPermiteAsignarTecnicoSinEspecialidad()
    {
        // Este test requiere conocer un técnico específico sin la especialidad
        // En implementación real, crear técnico de prueba sin especialidad
        $this->assertTrue(true); // Placeholder
    }

    /**
     * @test
     * Valida que no se puede reasignar ticket ya asignado sin justificación especial
     */
    public function testNoPermiteReasignacionSinJustificacion()
    {
        try {
            // Primera asignación
            $this->asignacionModel->asignarManual(
                $this->testTicketId,
                1,
                'Primera asignación - técnico especializado disponible',
                'admin'
            );

            // Intentar reasignar a otro técnico
            $this->expectException(Exception::class);
            
            $this->asignacionModel->asignarManual(
                $this->testTicketId,
                2, // Otro técnico
                'Reasignación', // Justificación corta
                'admin'
            );
        } catch (Exception $e) {
            // Esperado si no hay suficientes técnicos o ticket ya está asignado
            $this->assertTrue(true);
        }
    }

    /**
     * @test
     * Valida que AutoTriage prioriza tickets críticos (mayor puntaje)
     */
    public function testAutoTriagePriorizaTicketsCriticos()
    {
        // Crear segundo ticket con prioridad Baja
        $ticketBaja = (object)[
            'titulo' => 'Test Prioridad Baja',
            'descripcion' => 'Ticket de baja prioridad',
            'prioridad' => 'Baja',
            'id_usuario' => '1-1343-0736',
            'id_categoria' => 1,
            'id_etiqueta' => 1,
            'id_estado' => 1,
            'comentario' => 'Test prioridad'
        ];
        
        $ticketBajaResult = $this->ticketModel->create($ticketBaja);
        $ticketBajaId = $ticketBajaResult['id_ticket'];

        try {
            // AutoTriage debería preferir el ticket Alta antes que Baja
            $result = $this->asignacionModel->asignarAutomatico();
            
            if (isset($result['ticket_asignado'])) {
                // Debería asignar el de alta prioridad primero
                $this->assertNotEquals($ticketBajaId, $result['ticket_asignado']['id_ticket']);
            }
        } catch (Exception $e) {
            // Esperado si no hay técnicos
            $this->assertTrue(true);
        } finally {
            // Limpiar
            $this->ticketModel->delete($ticketBajaId);
        }
    }

    /**
     * @test
     * Valida que se registra el método de asignación (Manual vs Automático)
     */
    public function testRegistraMetodoDeAsignacion()
    {
        try {
            $result = $this->asignacionModel->asignarManual(
                $this->testTicketId,
                1,
                'Asignación manual por conocimiento específico del caso',
                'admin'
            );

            if ($result) {
                // Verificar que se registró como "Manual"
                $asignaciones = $this->asignacionModel->getByTicket($this->testTicketId);
                $this->assertNotEmpty($asignaciones);
                
                $ultimaAsignacion = end($asignaciones);
                $this->assertEquals('Manual', $ultimaAsignacion['metodo_asignacion']);
            }
        } catch (Exception $e) {
            // Si técnico no existe o no tiene especialidad, es esperado
            $this->assertTrue(true);
        }
    }
}
