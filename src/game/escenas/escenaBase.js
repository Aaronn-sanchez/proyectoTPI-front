import { Scene } from "phaser";

import {
    SONIDOS_CONTACTO,
    PROFUNDIDAD,
    CAPAS,
    CAPAS_VISUALES,
} from "../configs/constantes.js";

import { buscarCapa } from "../sistemas/utilidadesLDtk.js";
import { crearCapasVisuales } from "../sistemas/capasVisuales.js";
import { crearColisiones } from "../sistemas/colisiones.js";
import { crearCurvas } from "../sistemas/curvas.js";
import { crearCajas } from "../sistemas/cajas.js";
import { crearPlantas } from "../sistemas/plantas.js";
import { crearCheckpoints } from "../sistemas/checkpoints.js";
import { crearBotones } from "../sistemas/botones.js";
import { crearPuertas } from "../sistemas/puertas.js";
import { crearFinNivel } from "../sistemas/finNivel.js";
import { crearAgua, actualizarAguas } from "../sistemas/agua.js";
import { crearNubes } from "../sistemas/nubes.js";

import wachin from "../entidades/clases/wachin.js";
import { iniciarCarpincho, prepararFramesCarpincho } from "../entidades/personajes/carpincho.js";

import { registrarProgreso } from "../../api/logros.js";

export default class EscenaBase extends Scene {
    constructor(clave, claveJson, idNivelLDtk, rutaJson) {
        super(clave);
        this.claveJson = claveJson;
        this.idNivelLDtk = idNivelLDtk;
        this.rutaJson = rutaJson;
    }

    init(data) {
        this.guardadoInicial = data?.guardado ?? null;

        // Estado compartido por todos los sistemas
        this.puertas = [];
        this.botones = [];
        this.cajas = [];
        this.aguas = [];
        this.aguaPrevia = null;
        this.personaje = null;      // el personaje que controla el jugador en este nivel
        this.puntoRespawn = null;
    }

    // ---------- Carga de assets: lo común vive acá ----------
    preload() {
        // Efectos de sonido
        Object.values(SONIDOS_CONTACTO).forEach(({ clave, archivo }) => {
            this.load.audio(clave, archivo);
        });

        const escenario = "/assets/sprites/escenario/";
        const carpincho = "/assets/sprites/carpincho/";

        // Escenario
        this.load.image("cielo", escenario + "background-cielo.png");
        this.load.image("pastito_tiles", escenario + "pastitio.png");
        this.load.image("pozito_tiles", escenario + "pastito-pozito.png");
        this.load.image("hierbas", escenario + "pastito-pozito-con-hievas.png");
        this.load.image("suelo_nivel2", escenario + "suelo_de_nivel2.png");
        this.load.image("flor_espinas", escenario + "florecitas.png");
        this.load.image("textura_caja", escenario + "caja.png");
        this.load.image("banderin_checkpoint", escenario + "banderin-checkpoint.png");
        this.load.image("boton", escenario + "boton.png");
        this.load.image("boton_presionado", escenario + "boton-presionado.png");

        // Sprites del carpincho
        this.load.image("carpincho", carpincho + "carpincho.png");
        this.load.image("frame_1", carpincho + "casi de pie.png");
        this.load.image("frame_2", carpincho + "correccion frame 4.png");
        this.load.image("frame_3", carpincho + "frame 1.png");
        this.load.image("frame_4", carpincho + "frame 2.png");
        this.load.image("frame_5", carpincho + "frame 3.png");
        this.load.image("frame_6", carpincho + "frame 5.5.png");
        this.load.image("frame_7", carpincho + "frame f2-1.png");
        this.load.image("frame_8", carpincho + "frame f2-2.png");
        this.load.image("frame_9", carpincho + "frame f2-3.png");

        // JSON de LDtk del nivel
        this.load.json(this.claveJson, this.rutaJson);

        this.load.on("loaderror", (archivo) => {
            console.error("No se pudo cargar:", archivo.key);
            this.game.events.emit("nivel-error-carga", archivo.key);
        });

        this.cargarAssetsExtra();   // gancho: assets propios del nivel
    }

    // ---------- Ciclo de vida: el orden es fijo ----------
    create() {
        this.nivelTerminado = false;

        this.datosLDtk = this.cache.json.get(this.claveJson);
        this.nivel =
            this.datosLDtk.levels.find((l) => l.identifier === this.idNivelLDtk) ||
            this.datosLDtk.levels[0];

        const limites = this.calcularLimitesMundo(this.datosLDtk);
        this.matter.world.setBounds(limites.x, limites.y, limites.ancho, limites.alto);

        this.crearMundo(this.datosLDtk);
        this.aplicarEstadoObjetos();
        this.crearFondo();
        this.crearPersonaje(this.nivel);   // gancho: cada nivel elige personaje
        this.configurarEventosLogros();

        this.crearDeteccionContactos();
        this.crearCamaraYControles(limites);

        this.events.on("pause", () => this.input.keyboard.disableGlobalCapture());
        this.events.on("resume", () => {
            this.input.keyboard.resetKeys();
            this.input.keyboard.enableGlobalCapture();
        });

        this.alCrear();                    // gancho: extras del nivel
        this.game.events.emit("nivel-listo");
    }

    update(tiempo, delta) {
        if (!this.personaje) return;

        // El agua va ANTES de mover: aplica flotabilidad y arrastre
        actualizarAguas(this, tiempo, delta);

        this.moverPersonaje(delta);
        this.alActualizar(tiempo, delta);
    }

    // ---------- Ganchos (se sobreescriben por nivel) ----------
    cargarAssetsExtra() { }
    alCrear() { }
    alActualizar(tiempo, delta) { }

    configurarEventosLogros() {
        this.personaje.on("saltar", async () => {
            try {
                const resultado = await registrarProgreso("SALTAMONTES", 1);

                if (resultado.nuevo) {
                    this.game.events.emit('logro-desbloqueado', resultado);

                } else {
                    console.log("Progreso Saltamontes:", resultado.progreso);
                }

            } catch (error) {
                console.error("Error al registrar el logro:", error);
            }
        });
    }

    obtenerCapasVisuales() { return CAPAS_VISUALES; }

    // Por defecto el personaje es el carpincho. Un nivel con otro personaje
    // sobreescribe este método y deja el resultado en this.personaje.
    crearPersonaje(nivel) {
        const { x, y } = this.calcularInicio(nivel, "Spawn_carpincho");

        prepararFramesCarpincho(this);

        this.personaje = new wachin(this, x, y, "carpincho", iniciarCarpincho);
        this.personaje.setDepth(PROFUNDIDAD.CARPINCHO);
    }

    // Por defecto: mover + adaptación a pendientes del carpincho.
    // Un personaje distinto (benteveo) sobreescribe este método.
    moverPersonaje(delta) {
        this.personaje.mover(this.teclas, this.teclasWASD, delta);
        this.personaje.adaptarSueloCarpincho?.(delta);
    }

    // Posición inicial: la del guardado si existe; si no, la entidad de spawn
    // de LDtk (por su identificador); si tampoco hay, un valor por defecto.
    // También deja fijado el primer punto de reaparición.
    calcularInicio(nivel, identificadorSpawn) {
        const capaEntidades = buscarCapa(nivel, CAPAS.ENTIDADES);

        const spawn = capaEntidades?.entityInstances.find(
            (e) => e.__identifier === identificadorSpawn
        );

        const guardado = this.guardadoInicial;

        const tienePosicionGuardada =
            guardado &&
            guardado.pos_x !== null &&
            guardado.pos_x !== undefined &&
            guardado.pos_y !== null &&
            guardado.pos_y !== undefined &&
            Number.isFinite(Number(guardado.pos_x)) &&
            Number.isFinite(Number(guardado.pos_y));

        const x = tienePosicionGuardada
            ? Number(guardado.pos_x)
            : spawn
                ? spawn.px[0] + spawn.width / 2 + nivel.worldX
                : 160;

        const y = tienePosicionGuardada
            ? Number(guardado.pos_y)
            : spawn
                ? spawn.px[1] + spawn.height / 2 + nivel.worldY
                : 288;

        this.puntoRespawn = { x, y };
        return { x, y };
    }

    // ---------- Mundo ----------
    crearMundo(datosLDtk) {
        datosLDtk.levels.forEach((nivel) => {
            crearCapasVisuales(this, nivel, this.obtenerCapasVisuales());
            crearColisiones(this, nivel);
            crearCurvas(this, nivel);
            crearCajas(this, nivel);
            crearPlantas(this, nivel);
            crearCheckpoints(this, nivel);
            crearBotones(this, nivel);
            crearPuertas(this, nivel);
            crearFinNivel(this, nivel);
            crearAgua(this, nivel);
            crearNubes(this, nivel);
        });
    }

    calcularLimitesMundo(datosLDtk) {
        const niveles = datosLDtk.levels;
        const x = Math.min(...niveles.map((n) => n.worldX));
        const y = Math.min(...niveles.map((n) => n.worldY));
        const derecha = Math.max(...niveles.map((n) => n.worldX + n.pxWid));
        const abajo = Math.max(...niveles.map((n) => n.worldY + n.pxHei));
        return { x, y, ancho: derecha - x, alto: abajo - y };
    }

    // ---------- Fondo del cielo ----------
    crearFondo() {
        const imagenCielo = this.textures.get("cielo").getSourceImage();
        const anchoImg = imagenCielo.width;
        const altoImg = imagenCielo.height;

        // Textura espejada (original + copia volteada) para que no se vea costura.
        if (!this.textures.exists("cielo_espejo")) {
            const lienzo = this.textures.createCanvas("cielo_espejo", anchoImg * 2, altoImg);
            const ctx = lienzo.getContext();

            ctx.drawImage(imagenCielo, 0, 0);

            ctx.save();
            ctx.translate(anchoImg * 2, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(imagenCielo, 0, 0);
            ctx.restore();

            lienzo.refresh();
        }

        this.escalaCielo = 1;

        this.fondoCielo = this.add
            .tileSprite(0, 0, this.cameras.main.width, altoImg * this.escalaCielo, "cielo_espejo")
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(PROFUNDIDAD.CIELO);

        // Color de fondo = último píxel del cielo, para que no quede franja negra.
        const colorBorde = this.textures.getPixel(Math.floor(anchoImg / 2), altoImg - 1, "cielo");
        if (colorBorde) {
            this.cameras.main.setBackgroundColor(colorBorde.color);
        }
    }

    // ---------- Cámara y controles ----------
    crearCamaraYControles(limites) {
        const cam = this.cameras.main;

        cam.setBounds(limites.x, limites.y, limites.ancho, limites.alto);
        cam.startFollow(this.personaje, true, 0.08, 0.08);
        cam.setFollowOffset(0, 150);
        cam.centerOn(this.personaje.x, this.personaje.y - 150);

        this.teclas = this.input.keyboard.createCursorKeys();
        this.teclasWASD = this.input.keyboard.addKeys("W,A,S,D,SPACE");
    }

    // ---------- Guardado ----------
    capturarEstado() {
        if (!this.personaje) return null;

        return {
            pos_x: Math.round(this.personaje.x),
            pos_y: Math.round(this.personaje.y),
            estado_objetos: {
                version: 1,
                botones: this.botones.map((b) => ({ iid: b.iid, activado: b.activado })),
                puertas: this.puertas.map((p) => ({ iid: p.iid, abierta: p.abierta })),
                cajas: this.cajas.map((c) => ({
                    iid: c.iid,
                    x: Math.round(c.position.x),
                    y: Math.round(c.position.y),
                })),
            },
        };
    }

    aplicarEstadoObjetos() {
        const estado = this.guardadoInicial?.estado_objetos;
        if (!estado) return;

        (estado.botones || []).forEach((g) => {
            const boton = this.botones.find((b) => b.iid === g.iid);
            if (!boton || !g.activado) return;
            boton.activado = true;
            boton.objetoVisual.setTexture("boton_presionado", boton.framePresionado);
        });

        (estado.puertas || []).forEach((g) => {
            const puerta = this.puertas.find((p) => p.iid === g.iid);
            if (!puerta || !g.abierta) return;
            puerta.abierta = true;
            this.matter.world.remove(puerta);
            puerta.objetoVisual.destroy();
        });

        (estado.cajas || []).forEach((g) => {
            const caja = this.cajas.find((c) => c.iid === g.iid);
            if (!caja) return;
            const x = Number(g.x);
            const y = Number(g.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return;
            this.matter.body.setPosition(caja, { x, y });
            this.matter.body.setVelocity(caja, { x: 0, y: 0 });
        });
    }

    // ---------- Checkpoints y fin de nivel ----------
    activarCheckpoint(sensor) {
        if (sensor.activado) return;
        sensor.activado = true;
        this.puntoRespawn = { x: sensor.position.x, y: sensor.position.y };
        this.sound.play(SONIDOS_CONTACTO.pop.clave);
    }

    reaparecerPersonaje() {
        const { x, y } = this.puntoRespawn;
        this.personaje.setPosition(x, y);
        this.personaje.setVelocity(0, 0);
        this.sound.play(SONIDOS_CONTACTO.pop.clave);
    }

    finalizarNivel() {
        if (this.nivelTerminado) return;
        this.nivelTerminado = true;
        this.game.events.emit("nivel-completado");
    }

    // ---------- Contactos (botón → puerta, daño, checkpoint, fin) ----------
    crearDeteccionContactos() {
        this.matter.world.on("collisionstart", (evento) => {
            evento.pairs.forEach(({ bodyA, bodyB }) => {
                const detectable =
                    bodyA.tags?.includes("detectable") || bodyB.tags?.includes("detectable");
                if (!detectable) return;
                this.resolverInteraccion(bodyA, bodyB);
            });
        });
    }

    resolverInteraccion(bodyA, bodyB) {
        // Identificar el cuerpo principal si es compuesto
        const obtenerCuerpoPrincipal = (body) =>
            body.parent && body.parent !== body ? body.parent : body;

        const cuerpoA = obtenerCuerpoPrincipal(bodyA);
        const cuerpoB = obtenerCuerpoPrincipal(bodyB);

        // Buscar si alguno de los cuerpos es accionable
        const accionable = [cuerpoA, cuerpoB].find((body) =>
            body.tags?.includes("accionable")
        );

        if (accionable) {
            const otroCuerpo = accionable === cuerpoA ? cuerpoB : cuerpoA;

            if (!otroCuerpo.peso) return;

            // Comportamiento del botón
            if (accionable.label === "Boton_peso") {
                if (accionable.activado) return;

                accionable.activado = true;

                const puerta = this.puertas.find(
                    (p) => p.iid === accionable.objetivo?.entityIid
                );

                if (puerta && !puerta.abierta) {
                    puerta.abierta = true;

                    // Quitamos la colisión para permitir el paso
                    this.matter.world.remove(puerta);

                    // Hacemos desaparecer la puerta gradualmente
                    this.tweens.add({
                        targets: puerta.objetoVisual,
                        alpha: 0,
                        duration: 1200,
                        ease: "Linear",
                        onComplete: () => {
                            puerta.objetoVisual.destroy();
                        }
                    });
                }

                accionable.objetoVisual.setTexture(
                    "boton_presionado",
                    accionable.framePresionado
                );

                this.sound.play(SONIDOS_CONTACTO.pop.clave);
                return;
            }

            // Comportamiento de la puerta
            if (accionable.label === "Puerta") {
                return;
            }
        }

        // Identificar al personaje que controla el jugador
        const esPersonaje = (body) =>
            body === this.personaje.body || body.parent === this.personaje.body;

        let objeto;

        if (esPersonaje(bodyA)) {
            if (bodyA.isSensor) return;
            objeto = bodyB;
        } else if (esPersonaje(bodyB)) {
            if (bodyB.isSensor) return;
            objeto = bodyA;
        } else {
            return;
        }

        const tags = objeto.tags || [];

        // Daño
        if (tags.includes("entidad_danio")) {
            this.reaparecerPersonaje();
            return;
        }

        // Checkpoint
        if (tags.includes("guardado")) {
            this.activarCheckpoint(objeto);
            return;
        }

        // Fin del nivel
        if (tags.includes("fin_nivel")) {
            this.finalizarNivel();
            return;
        }
    }
}