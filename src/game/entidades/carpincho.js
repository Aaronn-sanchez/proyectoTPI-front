import Phaser from "phaser";

// ==========================================================
// TAMAÑO DEL CARPINCHO
// Un único número escala dibujo, hitbox y sensor de suelo.
// 1 = tamaño original, 1.5 = 50% más grande, 2 = el doble.
// ==========================================================
const ESCALA = 1.7;
const TAM = Math.round(48 * ESCALA); // tamaño final (px) de la celda de cada frame

// ==========================================================
// NORMALIZACIÓN DE FRAMES
// ==========================================================
const FRAMES_CARPINCHO = [
    'carpincho', 'frame_1', 'frame_2', 'frame_3', 'frame_4',
    'frame_5', 'frame_6', 'frame_7', 'frame_8', 'frame_9'
];

// Llamar UNA vez en create(), antes de crear al carpincho.
// Crea texturas 'cp_<nombre>' del mismo tamaño, con los pies alineados.
export function prepararFramesCarpincho(scene) {
    const imgs = FRAMES_CARPINCHO.map(k => scene.textures.get(k).getSourceImage());

    // Una única escala para TODOS los frames (se respetan las proporciones
    // relativas: el frame parado sale más alto que el sentado, como debe ser)
    const maxW = Math.max(...imgs.map(i => i.width));
    const maxH = Math.max(...imgs.map(i => i.height));
    const escala = Math.min(TAM / maxW, TAM / maxH);

    FRAMES_CARPINCHO.forEach((nombre, i) => {
        const clave = 'cp_' + nombre;
        if (scene.textures.exists(clave)) return;

        const img = imgs[i];
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);

        const lienzo = scene.textures.createCanvas(clave, TAM, TAM);
        const ctx = lienzo.getContext();
        ctx.imageSmoothingQuality = 'high';
        // centrado en X, pegado abajo (los pies siempre en el mismo lugar)
        ctx.drawImage(img, Math.round((TAM - w) / 2), TAM - h, w, h);
        lienzo.refresh();
    });
}

// ==========================================================
// CARPINCHO 
// ==========================================================
export function iniciarCarpincho(personaje) {
    // Adaptación a pendientes
    personaje.ultimoContactoCurva = -1000; // última vez que el sensor tocó una curva
    personaje.margenCurva = 150;           // ms que mantiene el ángulo tras perder la curva
    personaje.anguloMaximo = Phaser.Math.DegToRad(45); // tope de inclinación
    personaje.velocidadGiro = 0.008;                   // rad por ms (más alto = gira más rápido)
    personaje.anguloObjetivo = 0;                      // hacia dónde quiere rotar
    // Aterrizaje (para eventos de sonido)
    personaje.ultimoContactoSuelo = 0; // último instante con el sensor de suelo tocando algo y coso de coso
    //nodoymaswacho 

    personaje.peso = true;
    personaje.velocidadTierra = 4.5;
    personaje.fuerzaSalto = -8.5 * Math.sqrt(ESCALA); // más grande = salto más fuerte

    // Frenado gradual al soltar las teclas (más cerca de 1 = frena más lento)
    // 0.80 seco | 0.90 suave | 0.95 muy resbaloso
    personaje.frenado = 0.90;
    personaje.frenadoAire = 0.97; // en el aire conserva más el impulso

    // Parámetros de agua
    personaje.flotabilidad = 1.12;
    personaje.aceleracionNado = 0.25;
    personaje.aceleracionBuceo = 0.35;
    personaje.aceleracionEmerger = 0.30;
    personaje.umbralNado = 0.5;
    personaje.sumersion = 0;

    // Estado de suelo (se recalcula en cada paso de física)
    personaje.enSuelo = false;      // ¿el sensor de los pies toca algo sólido?
    personaje.sueloActual = null;   // cuerpo sobre el que está parado (piso, caja, etc.)

    // Coyote time: margen (ms) para saltar justo después de dejar el suelo
    personaje.margenCoyote = 1000;
    personaje.ultimoSuelo = -1000;

    // Sprite fijo mientras está en el aire
    personaje.spriteAire = 'cp_frame_8';   // 'cp_' + la clave del frame que quieras usar
    personaje.margenAire = 60;             // ms sin tocar suelo para considerarlo "en el aire"
    // (evita el parpadeo en rampas y curvas)

    // ==========================================================
    // ANIMACIONES
    // Los frames ya vienen normalizados a TAM x TAM (prepararFramesCarpincho),
    // así que NO se usa setDisplaySize: el sprite queda siempre en escala 1
    // y el cuerpo de Matter nunca se deforma.
    // ==========================================================
    personaje.setTexture('cp_carpincho');

    // Etapa 1: levantarse (una sola vez)
    personaje.scene.anims.create({
        key: 'carpincho_levantarse', frames: ['cp_carpincho', 'cp_frame_1', 'cp_frame_2', 'cp_frame_3', 'cp_frame_4', 'cp_frame_5']
            .map(key => ({ key })),

        frameRate: 12,
        repeat: 0
    });

    // Etapa 2: ciclo de caminata (bucle mientras camina)
    personaje.scene.anims.create({
        key: 'carpincho_caminando',
        frames: ['cp_frame_6', 'cp_frame_7', 'cp_frame_8', 'cp_frame_9']
            .map(key => ({ key })),
        frameRate: 10,
        repeat: -1
    });

    // Al terminar de levantarse, pasar directo a caminar
    personaje.on('animationcomplete-carpincho_levantarse', () => {
        personaje.play('carpincho_caminando', true);
    });

    // ==========================================================
    // CUERPO COMPUESTO: hitbox + SENSORES (suelo, izquierda, derecha)
    // ==========================================================
    const Matter = Phaser.Physics.Matter.Matter;
    const x = personaje.x;
    const y = personaje.y;
    const ancho = Math.round(34 * ESCALA);
    const alto = Math.round(30 * ESCALA);

    // Parte 1: cuerpo sólido.
    // Sin fricción: el frenado horizontal se hace a mano en mover(), y así
    // no pierde velocidad al subir rampas o curvas.
    const cuerpoPrincipal = Matter.Bodies.rectangle(x, y, ancho, alto, {
        friction: 0,
        frictionStatic: 0,
        restitution: 0.0,
        chamfer: { radius: [0, 0, Math.round(8 * ESCALA), Math.round(8 * ESCALA)] }
    });

    // Parte 2: sensor fino pegado a la base. No choca con nada (isSensor), solo
    // avisa si toca algo. Es más angosto que el cuerpo para que las paredes
    // laterales jamás lo toquen. Sobresale 3 px por debajo de los pies.
    const sensorSuelo = Matter.Bodies.rectangle(
        x, y + alto / 2 + 1, Math.round(20 * ESCALA), 4,
        { isSensor: true, label: 'sensorSuelo', density: 0.0001 }
    );

    // Sensores de pared: angostos y altos, pegados a los costados.
    // Miden solo el 60% de la altura y están centrados, así el piso
    // (a la altura de los pies) y el techo nunca los activan.
    const altoPared = Math.round(alto * 0.6);

    const sensorIzquierda = Matter.Bodies.rectangle(
        x - ancho / 2 - 1, y, 4, altoPared,
        { isSensor: true, label: 'sensorIzquierda', density: 0.0001 }
    );

    const sensorDerecha = Matter.Bodies.rectangle(
        x + ancho / 2 + 1, y, 4, altoPared,
        { isSensor: true, label: 'sensorDerecha', density: 0.0001 }
    );

    const compuesto = Matter.Body.create({
        parts: [cuerpoPrincipal, sensorSuelo, sensorIzquierda, sensorDerecha],
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0.02,
        restitution: 0.0
    });

    personaje.sensores = {
        suelo: sensorSuelo,
        izquierda: sensorIzquierda,
        derecha: sensorDerecha
    };

    personaje.setExistingBody(compuesto);
    personaje.setFixedRotation();
    personaje.setPosition(x, y);

    // setExistingBody calcula mal el origen: se fuerza.
    // El hitbox mide "alto" y el sprite TAM, así que se sube el dibujo la
    // diferencia / 2 para que los pies dibujados coincidan con la base del hitbox.
    personaje.setOrigin(0.5, 0.5 + ((TAM - alto) / 2) / TAM);

    // ==========================================================
    // DETECCIÓN DE CONTACTO DE TODOS LOS SENSORES
    // ==========================================================
    const mundo = personaje.scene.matter.world;

    // Lista de sensores del carpincho.
    const sensores = [
        sensorSuelo,
        sensorIzquierda,
        sensorDerecha
    ];

    // Inicializar el estado de cada sensor.
    for (const sensor of sensores) {
        sensor.tocando = false;
        sensor.estadoAnterior = false;
        sensor.contactos = [];
        sensor.contactoActual = null;
        sensor.labelContacto = null; // label del elemento que toca (null = no toca nada)
    }

    // Devuelve el label del cuerpo, o un texto por defecto si no tiene.
    // Matter pone label "Body" / "Rectangle Body" por defecto, así que
    // también se tratan como "sin label".
    const obtenerLabel = (cuerpo) => {
        const label = cuerpo.parent?.label ?? cuerpo.label;
        if (!label || label === 'Body' || label === 'Rectangle Body') {
            return 'elemento desconocido';
        }
        return label;
    };

    // Antes de cada paso de física, reiniciar los contactos.
    const reiniciarContactos = () => {
        personaje.enSuelo = false;
        personaje.sueloActual = null;

        for (const sensor of sensores) {
            sensor.tocando = false;
            sensor.contactos = [];
            sensor.contactoActual = null;
            sensor.labelContacto = null;
        }
    };

    // Detectar los contactos de todos los sensores.
    const detectarContacto = (evento) => {
        for (const contacto of evento.pairs) {
            let sensor;
            let otro;

            // Identificar si alguno de los cuerpos es uno de nuestros sensores.
            if (sensores.includes(contacto.bodyA)) {
                sensor = contacto.bodyA;
                otro = contacto.bodyB;
            } else if (sensores.includes(contacto.bodyB)) {
                sensor = contacto.bodyB;
                otro = contacto.bodyA;
            } else {
                continue;
            }

            // Ignorar otros sensores.
            if (otro.isSensor) continue;

            // Ignorar el propio carpincho.
            if (otro.parent === compuesto) continue;

            // Registrar el contacto.
            sensor.tocando = true;
            sensor.contactos.push(otro.parent);
            sensor.contactoActual = otro.parent;
            sensor.labelContacto = obtenerLabel(otro);

            // Mantener el comportamiento original del sensor de suelo.
            if (sensor === sensorSuelo) {
                personaje.enSuelo = true;
                personaje.sueloActual = otro.parent;
            }
        }
    };

    // Registrar los eventos de Matter.js.
    mundo.on('beforeupdate', reiniciarContactos);
    mundo.on('collisionstart', detectarContacto);
    mundo.on('collisionactive', detectarContacto);

    // Limpiar los eventos cuando se destruye el personaje (o se reinicia la
    // escena), para que no queden escuchando un cuerpo que ya no existe.
    personaje.once('destroy', () => {
        mundo.off('beforeupdate', reiniciarContactos);
        mundo.off('collisionstart', detectarContacto);
        mundo.off('collisionactive', detectarContacto);
    });
    // ==========================================================
    // ADAPTAR A LA PENDIENTE
    // Rota el cuerpo (hitbox + sensores + sprite) según el ángulo del suelo.
    // Llamar cada frame DESPUÉS de mover().
    // ==========================================================
    personaje.adaptarSueloCarpincho = function (delta) {
        const sensorSuelo = this.sensores.suelo;
        const ahora = this.scene.time.now;

        // Por defecto mantiene el objetivo actual
        let objetivo = this.anguloObjetivo;

        if (this.sumersion >= this.umbralNado) {
            // Nadando: sin inclinación
            objetivo = 0;
        } else {
            // Tramos curvos que toca (en empalmes puede tocar dos)
            const tramos = sensorSuelo.contactos.filter(c => c.pendiente !== undefined);

            if (tramos.length > 0) {
                objetivo = tramos.reduce((acc, c) => acc + c.pendiente, 0) / tramos.length;
                this.ultimoContactoCurva = ahora;
            } else if (ahora - this.ultimoContactoCurva > this.margenCurva) {
                // Hace rato que no toca ninguna curva: se endereza
                objetivo = 0;
            }
        }

        objetivo = Phaser.Math.Clamp(objetivo, -this.anguloMaximo, this.anguloMaximo);
        this.anguloObjetivo = objetivo;

        const actual = this.body.angle;
        const nuevo = Phaser.Math.Angle.RotateTo(actual, objetivo, this.velocidadGiro * delta);

        if (Math.abs(nuevo - actual) > 0.0001) {
            Matter.Body.setAngle(this.body, nuevo);
        }
    };
    // ==========================================================
    // MOVIMIENTO
    // ==========================================================
    personaje.mover = function (teclas, teclasWASD, delta) {
        const izq = teclas.left.isDown || teclasWASD.A.isDown;
        const der = teclas.right.isDown || teclasWASD.D.isDown;
        const arriba = teclas.up.isDown || teclasWASD.W.isDown || teclasWASD.SPACE.isDown;
        const abajo = teclas.down.isDown || teclasWASD.S.isDown;

        const s = this.sumersion;
        const ahora = this.scene.time.now;

        // COYOTE TIME: recordar el último instante en que tocó suelo
        if (this.enSuelo) this.ultimoSuelo = ahora;
        const puedeSaltar = ahora - this.ultimoSuelo < this.margenCoyote;

        // AVISO DE ATERRIZAJE: el sensor toca algo tras haber estado en el aire
        const labelSuelo = this.sensores.suelo.labelContacto;
        if (labelSuelo) {
            if (ahora - this.ultimoContactoSuelo > this.margenAire) {
                this.emit('aterrizar', labelSuelo);
            }
            this.ultimoContactoSuelo = ahora;
        }

        if (s >= this.umbralNado) {
            // NADANDO EN EL AGUA
            const dir = (der ? 1 : 0) - (izq ? 1 : 0);
            if (dir !== 0) {
                this.setVelocityX(this.body.velocity.x + dir * this.aceleracionNado);
                this.setFlipX(dir < 0);
            }

            if (abajo) {
                this.setVelocityY(this.body.velocity.y + this.aceleracionBuceo);
            } else if (arriba) {
                const empuje = Math.max(0, Math.min(1, (s - 0.5) / 0.4));
                this.setVelocityY(this.body.velocity.y - this.aceleracionEmerger * empuje);
            }
        } else {
            // EN TIERRA, EN EL AIRE O VADEANDO SOBRE CURVAS / RAMPAS
            const factor = 1 - 0.45 * s;
            const moviendo = izq || der;

            // En el aire = el sensor no toca suelo Y pasó más de margenAire ms
            const enAire = !this.enSuelo && (ahora - this.ultimoSuelo > this.margenAire);

            // ---- Movimiento horizontal ----
            let nuevaVx;
            if (moviendo) {
                nuevaVx = (izq ? -1 : 1) * this.velocidadTierra * factor;
                this.setFlipX(izq);
            } else {
                const f = enAire ? this.frenadoAire : this.frenado;
                const vx = this.body.velocity.x;
                nuevaVx = Math.abs(vx) < 0.2 ? 0 : vx * Math.pow(f, delta / 16.67);
            }
            this.setVelocityX(nuevaVx);

            // ---- Sprite según el estado ----
            if (enAire) {
                // Sprite fijo mientras no toca el suelo
                if (this.anims.isPlaying) this.anims.stop();
                if (this.texture.key !== this.spriteAire) this.setTexture(this.spriteAire);
            } else if (moviendo) {
                this.anims.timeScale = 1;
                const k = this.anims.currentAnim?.key;
                const enAnimCorrecta = this.anims.isPlaying &&
                    (k === 'carpincho_levantarse' || k === 'carpincho_caminando');
                if (!enAnimCorrecta) this.play('carpincho_levantarse', true);
            } else if (nuevaVx === 0) {
                // Detenido: pose sentado, una sola vez
                this.anims.timeScale = 1;
                if (this.anims.isPlaying || this.texture.key !== 'cp_carpincho') {
                    this.anims.stop();
                    this.setTexture('cp_carpincho');
                }
            } else {
                // Frenando sobre el suelo: patas más lentas
                if (!this.anims.isPlaying) this.play('carpincho_caminando', true);
                this.anims.timeScale = Math.max(0.3, Math.abs(nuevaVx) / this.velocidadTierra);
            }

            if (arriba && puedeSaltar) {
                this.setVelocityY(this.fuerzaSalto);
                this.ultimoSuelo = -1000;   // consumir el margen: evita un doble salto
            }
        }
    };
}