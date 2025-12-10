<?php
class TecnicoModel
{
    public $enlace;
    public function __construct()
    {
        $this->enlace = new MySqlConnect();
    }
    /*Listar */
    public function all()
    {
        try {
            // Listado completo de técnicos con correo y conteo de tickets abiertos (Asignado/En Proceso)
            $vSql = "SELECT 
                        t.id_tecnico,
                        u.nombre AS nombre,
                        u.correo AS correo,
                        (
                          SELECT COUNT(*) FROM ticket tk 
                          WHERE tk.id_tecnico = t.id_tecnico AND tk.id_estado IN (2,3)
                        ) AS tickets_abiertos
                     FROM tecnico t
                     JOIN usuario u ON t.id_usuario = u.id_usuario
                     ORDER BY u.nombre";

            $vResultado = $this->enlace->ExecuteSQL($vSql);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /* Listar técnicos que tienen al menos un ticket asignado */
    public function withTickets()
    {
        try {
            $vSql = "SELECT t.id_tecnico, u.nombre AS nombre, u.id_usuario
                     FROM tecnico t
                     JOIN usuario u ON t.id_usuario = u.id_usuario
                     WHERE EXISTS (SELECT 1 FROM ticket tk WHERE tk.id_tecnico = t.id_tecnico)
                     ORDER BY u.nombre";

            $vResultado = $this->enlace->ExecuteSQL($vSql);
            return $vResultado;
        } catch (Exception $e) {
            handleException($e);
        }
    }
    /*Obtener */
    public function get($id)
    {
        try {
            $vSql = "SELECT t.*, 
                            u.nombre AS nombre_usuario, 
                            u.correo AS correo_usuario
                    FROM tecnico t
                    JOIN usuario u ON t.id_usuario = u.id_usuario
            WHERE t.id_tecnico = ?";

            $vResultado = $this->enlace->executePrepared($vSql, 'i', [(int)$id]);

            if (empty($vResultado)) {
                return null;
            }
            $tec = $vResultado[0];

            // Carga de trabajo por estado (detalle) — no sobrescribir la columna numérica `carga_trabajo`
            $sqlCarga = "SELECT e.nombre AS estado, COUNT(*) AS total
                         FROM ticket t
                         JOIN estado e ON e.id_estado = t.id_estado
                         WHERE t.id_tecnico = ?
                         GROUP BY e.nombre";
            $carga = $this->enlace->executePrepared($sqlCarga, 'i', [(int)$id]);
            $tec->carga_por_estado = $carga ?: [];

            // Disponibilidad: usar columna y una calculada segun tickets abiertos (Asignado/En Proceso)
            $sqlAbiertos = "SELECT COUNT(*) AS abiertos FROM ticket WHERE id_tecnico = ? AND id_estado IN (2,3)";
            $abiertos = $this->enlace->executePrepared($sqlAbiertos, 'i', [(int)$id]);
            $tec->tickets_abiertos = isset($abiertos[0]->abiertos) ? (int)$abiertos[0]->abiertos : 0;
            $tec->disponibilidad_tabla = isset($tec->disponibilidad) ? (bool)$tec->disponibilidad : null;
            // Regla simple: disponible si tiene menos de 5 tickets abiertos
            $tec->disponibilidad_calculada = $tec->tickets_abiertos < 5;

            // Especialidades del técnico desde la tabla intermedia tecnico_especialidad
            $sqlEsp = "SELECT e.id_especialidad, e.nombre, e.descripcion
                       FROM tecnico_especialidad te
                       JOIN especialidad e ON e.id_especialidad = te.id_especialidad
                       WHERE te.id_tecnico = ?";
            $especialidades = $this->enlace->executePrepared($sqlEsp, 'i', [(int)$id]);
            $tec->especialidades = $especialidades ?: [];

            return $tec;
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function create($objeto)
    {
        try {
            // --- Validaciones ---
            if (empty($objeto->id_usuario) || empty($objeto->nombre) || empty($objeto->correo) || empty($objeto->password)) {
                throw new Exception("Campos requeridos: id_usuario, nombre, correo, password");
            }

            if (strlen($objeto->nombre) < 3 || strlen($objeto->nombre) > 150) {
                throw new Exception("El nombre debe tener entre 3 y 150 caracteres");
            }

            if (!filter_var($objeto->correo, FILTER_VALIDATE_EMAIL)) {
                throw new Exception("Formato de correo inválido");
            }

            // Validar longitud mínima de password
            if (strlen($objeto->password) < 6) {
                throw new Exception("La contraseña debe tener al menos 6 caracteres");
            }

            // Validar que el correo no esté duplicado
            $sqlCheckEmail = "SELECT COUNT(*) as count FROM usuario WHERE correo = ?";
            $resultEmail = $this->enlace->executePrepared($sqlCheckEmail, 's', [$objeto->correo]);
            if ($resultEmail[0]->count > 0) {
                throw new Exception("El correo ya está registrado");
            }

            // Validar que el id_usuario no esté duplicado
            $sqlCheckId = "SELECT COUNT(*) as count FROM usuario WHERE id_usuario = ?";
            $resultId = $this->enlace->executePrepared($sqlCheckId, 's', [$objeto->id_usuario]);
            if ($resultId[0]->count > 0) {
                throw new Exception("El ID de usuario ya está registrado");
            }

            // Hash de la contraseña
            $hashedPassword = hash('sha256', $objeto->password);

            // Defaults
            $disponibilidad = isset($objeto->disponibilidad) ? (bool)$objeto->disponibilidad : true;
            $cargaTrabajo = isset($objeto->carga_trabajo) ? (int)$objeto->carga_trabajo : 0;
            $idRol = isset($objeto->id_rol) ? (int)$objeto->id_rol : 2; // Default a técnico (id_rol 2)

            // --- 1. Crear el usuario ---
            $sqlUsuario = "INSERT INTO usuario (id_usuario, nombre, correo, password, id_rol)
                       VALUES (?, ?, ?, ?, ?)";
            $this->enlace->executePrepared($sqlUsuario, 'ssssi', [
                $objeto->id_usuario,
                $objeto->nombre,
                $objeto->correo,
                $hashedPassword,
                $idRol
            ]);

            // --- 2. Si es técnico, crear el técnico asociado ---
            if ($idRol == 2) {
                $sqlTecnico = "INSERT INTO tecnico (id_usuario, disponibilidad, carga_trabajo)
                           VALUES (?, ?, ?)";
                $this->enlace->executePrepared($sqlTecnico, 'sii', [
                    $objeto->id_usuario,
                    $disponibilidad ? 1 : 0,
                    $cargaTrabajo
                ]);

                // --- 3. Obtener el id_tecnico recién creado ---
                $sqlGetId = "SELECT id_tecnico FROM tecnico WHERE id_usuario = ?";
                $result = $this->enlace->executePrepared($sqlGetId, 's', [$objeto->id_usuario]);
                $idTecnico = $result[0]->id_tecnico;

                // --- 4. Insertar especialidades del técnico ---
                if (isset($objeto->especialidades) && is_array($objeto->especialidades) && !empty($objeto->especialidades)) {
                    foreach ($objeto->especialidades as $id_especialidad) {
                        $sqlEsp = "INSERT INTO tecnico_especialidad (id_tecnico, id_especialidad) VALUES (?, ?)";
                        $this->enlace->executePrepared($sqlEsp, 'ii', [
                            (int)$idTecnico,
                            (int)$id_especialidad
                        ]);
                    }
                }

                // --- 5. Retornar el técnico recién creado ---
                return $this->get($idTecnico);
            } else {
                // Si no es técnico, retornar usuario creado
                $usuarioModel = new UsuarioModel();
                return $usuarioModel->get($objeto->id_usuario);
            }
        } catch (Exception $e) {
            handleException($e);
        }
    }

    public function update($objeto)
    {
        try {
            // --- Validaciones ---
            if (empty($objeto->id_tecnico)) {
                throw new Exception("Campos requerido: id_tecnico");
            }

            // --- 1. Actualizar disponibilidad del técnico ---
            if (isset($objeto->disponibilidad)) {
                $sqlTecnico = "UPDATE tecnico SET disponibilidad = ? WHERE id_tecnico = ?";
                $this->enlace->executePrepared($sqlTecnico, 'ii', [
                    $objeto->disponibilidad ? 1 : 0,
                    (int)$objeto->id_tecnico
                ]);
            }

            // --- 1.b Actualizar carga_trabajo del técnico ---
            if (isset($objeto->carga_trabajo)) {
                $sqlCargaUpd = "UPDATE tecnico SET carga_trabajo = ? WHERE id_tecnico = ?";
                $this->enlace->executePrepared($sqlCargaUpd, 'ii', [
                    (int)$objeto->carga_trabajo,
                    (int)$objeto->id_tecnico
                ]);
            }

            // --- 2. Actualizar especialidades del técnico ---
            if (isset($objeto->especialidades) && is_array($objeto->especialidades)) {
                // Eliminar especialidades anteriores
                $sqlDelete = "DELETE FROM tecnico_especialidad WHERE id_tecnico = ?";
                $this->enlace->executePrepared($sqlDelete, 'i', [(int)$objeto->id_tecnico]);

                // Insertar nuevas especialidades
                if (!empty($objeto->especialidades)) {
                    foreach ($objeto->especialidades as $id_especialidad) {
                        $sqlInsert = "INSERT INTO tecnico_especialidad (id_tecnico, id_especialidad) VALUES (?, ?)";
                        $this->enlace->executePrepared($sqlInsert, 'ii', [
                            (int)$objeto->id_tecnico,
                            (int)$id_especialidad
                        ]);
                    }
                }
            }

            // Retornar el técnico actualizado
            return $this->get($objeto->id_tecnico);

        } catch (Exception $e) {
            handleException($e);
        }
    }

    /* Toggle disponibilidad */
    public function toggleDisponibilidad($id_tecnico)
    {
        try {
            // Obtener disponibilidad actual
            $sql = "SELECT disponibilidad FROM tecnico WHERE id_tecnico = ?";
            $result = $this->enlace->executePrepared($sql, 'i', [(int)$id_tecnico]);
            
            if (empty($result)) {
                throw new Exception("Técnico no encontrado");
            }

            // executePrepared retorna objetos por defecto (resultType = "obj")
            $disponibilidadActual = isset($result[0]->disponibilidad) ? (int)$result[0]->disponibilidad : 0;
            $nuevaDisponibilidad = $disponibilidadActual === 1 ? 0 : 1;

            // Actualizar disponibilidad
            $sqlUpdate = "UPDATE tecnico SET disponibilidad = ? WHERE id_tecnico = ?";
            $this->enlace->executePrepared($sqlUpdate, 'ii', [$nuevaDisponibilidad, (int)$id_tecnico]);

            // Retornar el técnico actualizado
            return $this->get($id_tecnico);

        } catch (Exception $e) {
            handleException($e);
        }
    }

    /** Eliminar técnico solo si no tiene tickets asociados (FK restrict) */
    public function delete($id)
    {
        try {
            $id = (int)$id;
            if ($id <= 0) {
                throw new Exception('ID técnico inválido');
            }
            // Verificar tickets asociados
            $sqlCount = "SELECT COUNT(*) AS total FROM ticket WHERE id_tecnico = ?";
            $resCount = $this->enlace->executePrepared($sqlCount, 'i', [ $id ]);
            $total = (int)($resCount[0]->total ?? 0);
            if ($total > 0) {
                throw new Exception('No se puede eliminar: técnico con tickets asociados');
            }
            // Obtener id_usuario vinculado para limpieza opcional
            $sqlUsr = "SELECT id_usuario FROM tecnico WHERE id_tecnico = ?";
            $resUsr = $this->enlace->executePrepared($sqlUsr, 'i', [ $id ]);
            $idUsuario = $resUsr[0]->id_usuario ?? null;
            // Eliminar técnico
            $this->enlace->executePrepared_DML('DELETE FROM tecnico WHERE id_tecnico = ?', 'i', [ $id ]);
            // Opcional: eliminar usuario si rol = 2 y no es utilizado por otro técnico
            if ($idUsuario) {
                $sqlRol = "SELECT id_rol FROM usuario WHERE id_usuario = ?";
                $rolRes = $this->enlace->executePrepared($sqlRol, 's', [ $idUsuario ]);
                $rol = $rolRes[0]->id_rol ?? null;
                if ((int)$rol === 2) {
                    // Asegurar que no queda relación
                    $chkTec = $this->enlace->executePrepared('SELECT COUNT(*) AS c FROM tecnico WHERE id_usuario = ?', 's', [ $idUsuario ]);
                    if ((int)($chkTec[0]->c ?? 0) === 0) {
                        $this->enlace->executePrepared_DML('DELETE FROM usuario WHERE id_usuario = ?', 's', [ $idUsuario ]);
                    }
                }
            }
            return (object)[ 'deleted' => true, 'id_tecnico' => $id, 'message' => 'Técnico eliminado correctamente' ];
        } catch (Exception $e) {
            handleException($e);
        }
    }

    /* Obtener especialidades de un técnico por id_usuario */
    public function getEspecialidades($idUsuario)
    {
        try {
            $sqlEsp = "SELECT e.id_especialidad, e.nombre, e.descripcion
                       FROM tecnico t
                       JOIN tecnico_especialidad te ON t.id_tecnico = te.id_tecnico
                       JOIN especialidad e ON e.id_especialidad = te.id_especialidad
                       WHERE t.id_usuario = ?";
            $especialidades = $this->enlace->executePrepared($sqlEsp, 's', [(string)$idUsuario]);
            
            return $especialidades ?: [];
        } catch (Exception $e) {
            handleException($e);
        }
    }
}

