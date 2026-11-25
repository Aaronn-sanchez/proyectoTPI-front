
import Phaser, { Scene } from "phaser";
import wachin from "../entidades/clases/wachin.js";
import { iniciarCarpincho, prepararFramesCarpincho } from "../entidades/personajes/carpincho.js";
import { crearSuperficieCurva } from "../utilidades/superficiesCurvas.js";
import { TAM_TILE, CAPAS, CUERPOS_INTGRID, PROFUNDIDAD, SONIDOS_CONTACTO } from "../configs/constantes.js";

// Propias de esta escena
const CLAVE_NIVEL = "nivel_0";
const ID_NIVEL = "Level_0";

// ============================================================
// ESCENA
// ============================================================
export default class TutorialBasico extends Scene {
    constructor(guardadoInicial = null) {
        super("tutorialBasico");
        this.puertas = [];
        this.botones = [];
        this.cajas = [];
        this.guardadoInicial = guardadoInicial;
    }

    preload() {
        // Efectos de sonido
        Object.values(SONIDOS_CONTACTO).forEach(({ clave, archivo }) => {
            this.load.audio(clave, archivo);
        });

        const url = "/assets/sprites/escenario/";
        const url2 = "/assets/sprites/carpincho/";

        // Imágenes del escenario
        this.load.image("cielo", url + "background-cielo.png");
        this.load.image("pastito_tiles", url + "pastitio.png");
        this.load.image("pozito_tiles", url + "pastito-pozito.png");
        this.load.image("hierbas", url + "pastito-pozito-con-hievas.png");
        this.load.image("suelo_nivel2", url + "suelo_de_nivel2.png");
        this.load.image("flor_espinas", url + "florecitas.png");
        this.load.image("textura_caja", url + "caja.png");
        this.load.image("banderin_checkpoint", url + "banderin-checkpoint.png");
        this.load.image("boton", url + "boton.png");
        this.load.image("boton_presionado", url + "boton-presionado.png");

        this.load.json(CLAVE_NIVEL, "/assets/levels/humedal_level.json");

        // Sprites del carpincho
        this.load.image("carpincho", url2 + "carpincho.png");
        this.load.image("frame_1", url2 + "casi de pie.png");
        this.load.image("frame_2", url2 + "correccion frame 4.png");
        this.load.image("frame_3", url2 + "frame 1.png");
        this.load.image("frame_4", url2 + "frame 2.png");
        this.load.image("frame_5", url2 + "frame 3.png");
        this.load.image("frame_6", url2 + "frame 5.5.png");
        this.load.image("frame_7", url2 + "frame f2-1.png");
        this.load.image("frame_8", url2 + "frame f2-2.png");
        this.load.image("frame_9", url2 + "frame f2-3.png");

        this.load.on("loaderror", (archivo) => {
            console.error("No se pudo cargar:", archivo.key);
            this.game.events.emit("nivel-error-carga", archivo.key);
        });
    }

    create() {
        this.nivelTerminado = false;

        const datosLDtk = this.cache.json.get(CLAVE_NIVEL);

        const nivel = datosLDtk.levels.find(
            (l) => l.identifier === ID_NIVEL
        ) || datosLDtk.levels[0];

        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        // Límites físicos del mundo en Matter
        const limites = this.calcularLimitesMundo(datosLDtk);
        this.matter.world.setBounds(
            limites.x,
            limites.y,
            limites.ancho,
            limites.alto
        );

        this.crearMundo(datosLDtk);
        this.aplicarEstadoObjetos();

        this.crearFondo();
        this.crearCarpincho(nivel);

        this.crearDeteccionContactos();
        this.crearCamaraYControles(limites);

        this.events.on("resume", () => {
            this.input.keyboard.resetKeys();
        });

        this.game.events.emit("nivel-listo");

        this.events.on("pause", () => this.input.keyboard.disableGlobalCapture());
        this.events.on("resume", () => this.input.keyboard.enableGlobalCapture());
    }

    update(tiempo, delta) {
        if (!this.carpincho) return;

        this.carpincho.mover(this.teclas, this.teclasWASD, delta);
        this.carpincho.adaptarSueloCarpincho(delta);

        // Zoom y encuadre dinámico en el tramo de la bajada
        const cam = this.cameras.main;
        const enTramoBajada = this.carpincho.x > 1850 && this.carpincho.x < 2700;

        const zoomObjetivo = enTramoBajada ? 1.35 : 1;
        const offsetYObjetivo = enTramoBajada ? 90 : 110;

        cam.setZoom(Phaser.Math.Linear(cam.zoom, zoomObjetivo, 0.05));
        cam.followOffset.y = Phaser.Math.Linear(
            cam.followOffset.y,
            offsetYObjetivo,
            0.05
        );

        // Parallax del cielo
        if (this.fondoCielo) {
            this.fondoCielo.tilePositionX = cam.scrollX * 0.2;
        }
    }

    // =======================================================
    // HELPERS
    // =======================================================

    aplicarEstadoObjetos() {
        console.log("APLICANDO ESTADO DE OBJETOS");
        console.log("GUARDADO INICIAL:", this.guardadoInicial);
        console.log("ESTADO RECIBIDO:", this.guardadoInicial?.estado_objetos);

        const estado = this.guardadoInicial?.estado_objetos;

        if (!estado) {
            console.log("NO HAY ESTADO DE OBJETOS PARA RESTAURAR");
            return;
        }

        // Recuperar botones
        (estado.botones || []).forEach((guardado) => {
            const boton = this.botones.find(
                (b) => b.iid === guardado.iid
            );

            if (!boton || !guardado.activado) return;

            boton.activado = true;

            boton.objetoVisual.setTexture(
                "boton_presionado",
                boton.framePresionado
            );
        });

        // Recuperar puertas
        (estado.puertas || []).forEach((guardado) => {
            const puerta = this.puertas.find(
                (p) => p.iid === guardado.iid
            );

            if (!puerta || !guardado.abierta) return;

            puerta.abierta = true;

            this.matter.world.remove(puerta);
            puerta.objetoVisual.destroy();
        });

        // Recuperar cajas
        (estado.cajas || []).forEach((guardado) => {
            const caja = this.cajas.find((c) => c.iid === guardado.iid);
            if (!caja) return;

            const x = Number(guardado.x);
            const y = Number(guardado.y);

            if (!Number.isFinite(x) || !Number.isFinite(y)) return;

            this.matter.body.setPosition(caja, { x, y });
            this.matter.body.setVelocity(caja, { x: 0, y: 0 });
        });
    }

    crearFinNivel(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Fin_nivel")
            .forEach((e) => {
                const x = e.px[0] + nivel.worldX + e.width * (0.5 - e.__pivot[0]);
                const y = e.px[1] + nivel.worldY + e.height * (0.5 - e.__pivot[1]);

                const zona = this.matter.add.rectangle(x, y, e.width, e.height, {
                    isSensor: true,
                    isStatic: true,
                    label: "fin_nivel",
                });

                zona.tags = e.__tags || [];
            });
    }

    activarBoton(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Boton_peso")
            .forEach((e) => {
                const campos = Object.fromEntries(
                    e.fieldInstances.map((f) => [f.__identifier, f.__value])
                );

                const ancho = e.width;
                const alto = e.height;

                const posicion = {
                    x: e.px[0] + nivel.worldX,
                    y: e.px[1] + nivel.worldY
                };

                if (!campos.Tile_boton || !campos.Tile_boton_presionado) return;

                const {
                    x: xNormal,
                    y: yNormal,
                    w: wNormal,
                    h: hNormal
                } = campos.Tile_boton;

                const {
                    x: xPresionado,
                    y: yPresionado,
                    w: wPresionado,
                    h: hPresionado
                } = campos.Tile_boton_presionado;

                const texturaNormal = this.textures.get("boton");
                const texturaPresionada = this.textures.get("boton_presionado");

                const frameNormal = `${xNormal}_${yNormal}_${wNormal}_${hNormal}`;
                const framePresionado = `${xPresionado}_${yPresionado}_${wPresionado}_${hPresionado}`;

                if (!texturaNormal.has(frameNormal)) {
                    texturaNormal.add(frameNormal, 0, xNormal, yNormal, wNormal, hNormal);
                }

                if (!texturaPresionada.has(framePresionado)) {
                    texturaPresionada.add(
                        framePresionado,
                        0,
                        xPresionado,
                        yPresionado,
                        wPresionado,
                        hPresionado
                    );
                }

                const boton = this.matter.add.image(
                    posicion.x,
                    posicion.y,
                    "boton",
                    frameNormal
                );

                boton.setDisplaySize(ancho, alto);
                boton.setDepth(PROFUNDIDAD.PIEDRA);

                boton.setRectangle(ancho, alto, {
                    isSensor: true,
                    isStatic: true,
                    label: "Boton_peso"
                });

                boton.body.tags = e.__tags || [];
                boton.body.activado = false;

                boton.body.iid = e.iid;
                boton.body.objetoVisual = boton;
                boton.body.framePresionado = framePresionado;
                boton.body.frameNormal = frameNormal;
                boton.body.objetivo = campos.objetivo;

                this.botones.push(boton.body);
            });
    }

    crearCheckpoints(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Enty_Checkpoint")
            .forEach((e) => {
                const campos = Object.fromEntries(
                    e.fieldInstances.map((f) => [f.__identifier, f.__value])
                );

                const ancho = e.width;
                const alto = e.height;

                const posicion = {
                    x: e.px[0] + nivel.worldX,
                    y: e.px[1] + nivel.worldY
                };

                if (!campos.checkpoint_tile) return;

                const {
                    x: recorteX,
                    y: recorteY,
                    w: recorteW,
                    h: recorteH
                } = campos.checkpoint_tile;

                const textura_checkpoint = this.textures.get("banderin_checkpoint");
                const frame = `${recorteX}_${recorteY}_${recorteW}_${recorteH}`;

                if (!textura_checkpoint.has(frame)) {
                    textura_checkpoint.add(
                        frame,
                        0,
                        recorteX,
                        recorteY,
                        recorteW,
                        recorteH
                    );
                }

                const banderin = this.matter.add.image(
                    posicion.x,
                    posicion.y,
                    "banderin_checkpoint",
                    frame
                );

                banderin.setDisplaySize(ancho, alto);
                banderin.setDepth(PROFUNDIDAD.PIEDRA);

                banderin.setRectangle(ancho, alto, {
                    isSensor: campos.es_sensor,
                    isStatic: true,
                    label: campos.label,
                });

                banderin.body.tags = e.__tags || [];
                banderin.body.activado = false;
            });
    }

    activarCheckpoint(sensor) {
        if (sensor.activado) return;

        sensor.activado = true;
        this.puntoRespawn = {
            x: sensor.position.x,
            y: sensor.position.y
        };

        this.sound.play(SONIDOS_CONTACTO.pop.clave);
    }

    reaparecerCarpincho() {
        const { x, y } = this.puntoRespawn;

        this.carpincho.setPosition(x, y);
        this.carpincho.setVelocity(0, 0);

        this.sound.play(SONIDOS_CONTACTO.pop.clave);
    }

    capturarEstado() {
        if (!this.carpincho) return null;

        console.log("POSICIONES AL GUARDAR:", this.cajas.map((caja) => ({
            iid: caja.iid,
            x: caja.position.x,
            y: caja.position.y
        })));

        return {
            pos_x: Math.round(this.carpincho.x),
            pos_y: Math.round(this.carpincho.y),

            estado_objetos: {
                version: 1,

                botones: this.botones.map((boton) => ({
                    iid: boton.iid,
                    activado: boton.activado
                })),

                puertas: this.puertas.map((puerta) => ({
                    iid: puerta.iid,
                    abierta: puerta.abierta
                })),

                cajas: this.cajas.map((caja) => ({
                    iid: caja.iid,
                    x: Math.round(caja.position.x),
                    y: Math.round(caja.position.y)
                }))
            }
        };
    }

    finalizarNivel() {
        console.log("finalizarNivel llamado");
        if (this.nivelTerminado) return;

        this.nivelTerminado = true;

        // La escena no habla con la API: avisa y juego.jsx se encarga
        this.game.events.emit("nivel-completado");
    }

    crearDeteccionContactos() {
        this.matter.world.on("collisionstart", (evento) => {
            evento.pairs.forEach(({ bodyA, bodyB }) => {
                const detectable =
                    bodyA.tags?.includes("detectable") ||
                    bodyB.tags?.includes("detectable");

                if (!detectable) return;

                this.procesarColision(bodyA, bodyB);
            });
        });
    }

    procesarColision(bodyA, bodyB) {
        this.resolverInteraccion(bodyA, bodyB);
    }

    resolverInteraccion(bodyA, bodyB) {
        // Identificar el cuerpo principal si es compuesto
        const obtenerCuerpoPrincipal = (body) =>
            body.parent && body.parent !== body
                ? body.parent
                : body;

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

        // Identificar al carpincho
        const esCarpincho = (body) =>
            body === this.carpincho.body ||
            body.parent === this.carpincho.body;

        let objeto;

        if (esCarpincho(bodyA)) {
            if (bodyA.isSensor) return;
            objeto = bodyB;

        } else if (esCarpincho(bodyB)) {
            if (bodyB.isSensor) return;
            objeto = bodyA;

        } else {
            return;
        }

        const tags = objeto.tags || [];

        // Daño
        if (tags.includes("entidad_danio")) {
            this.reaparecerCarpincho();
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

    crearPuerta(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Puerta")
            .forEach((e) => {
                const posicion = {
                    x: e.px[0] + nivel.worldX,
                    y: e.px[1] + nivel.worldY
                };

                // Obtenemos el color asignado a la entidad en LDtk
                const color = Phaser.Display.Color.HexStringToColor(
                    e.__smartColor || "#8b5a2b"
                ).color;

                // Creamos la representación visual de la puerta
                const visual = this.add.rectangle(
                    posicion.x,
                    posicion.y,
                    e.width,
                    e.height,
                    color
                );

                // Le agregamos el cuerpo físico de Matter
                this.matter.add.gameObject(visual, {
                    isStatic: true,
                    label: "Puerta"
                });

                const puerta = visual.body;

                puerta.tags = e.__tags || [];
                puerta.abierta = false;
                puerta.iid = e.iid;
                puerta.objetoVisual = visual;

                this.puertas.push(puerta);
            });
    }

    crearPlantas(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Planta_espinas")
            .forEach((e) => {
                const ancho = e.width;
                const alto = e.height;
                const tags_group = e.__tags;

                const posicion = {
                    x: e.px[0] + nivel.worldX + ancho / 2,
                    y: e.px[1] + nivel.worldY + alto / 2
                };

                const campos = Object.fromEntries(
                    e.fieldInstances.map((f) => [f.__identifier, f.__value])
                );

                if (!e.__tile) return;

                const {
                    x: recorteX,
                    y: recorteY,
                    w: recorteW,
                    h: recorteH
                } = e.__tile;

                const plantaTexture = this.textures.get("flor_espinas");
                const framePlanta = `${recorteX}_${recorteY}_${recorteW}_${recorteH}`;

                if (!plantaTexture.has(framePlanta)) {
                    plantaTexture.add(
                        framePlanta,
                        0,
                        recorteX,
                        recorteY,
                        recorteW,
                        recorteH
                    );
                }

                const planta = this.matter.add.image(
                    posicion.x,
                    posicion.y,
                    "flor_espinas",
                    framePlanta
                );

                planta.setDisplaySize(ancho, alto);
                planta.setDepth(PROFUNDIDAD.CARPINCHO);

                planta.setRectangle(ancho, alto, {
                    isSensor: campos.es_sensor,
                    label: campos.label,
                    isStatic: true
                });

                planta.body.tags = tags_group;
            });
    }

    crearCajas(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Caja")
            .forEach((e) => {
                const ancho = e.width;
                const alto = e.height;

                const posicion = {
                    x: e.px[0] + nivel.worldX,
                    y: e.px[1] + nivel.worldY
                };

                const campos = Object.fromEntries(
                    e.fieldInstances.map((f) => [f.__identifier, f.__value])
                );

                if (!campos.cajita_tile) return;

                const {
                    x: recorteX,
                    y: recorteY,
                    w: recorteW,
                    h: recorteH
                } = campos.cajita_tile;

                const cajaTexturas = this.textures.get("textura_caja");
                const cajaFrame = `${recorteX}_${recorteY}_${recorteW}_${recorteH}`;

                if (!cajaTexturas.has(cajaFrame)) {
                    cajaTexturas.add(
                        cajaFrame,
                        0,
                        recorteX,
                        recorteY,
                        recorteW,
                        recorteH
                    );
                }

                const caja = this.matter.add.image(
                    posicion.x,
                    posicion.y,
                    "textura_caja",
                    cajaFrame
                );

                caja.setDisplaySize(ancho, alto);
                caja.setDepth(PROFUNDIDAD.CARPINCHO);

                caja.setRectangle(ancho, alto, {
                    friction: 0.5,
                    label: campos.label,
                    density: campos.densidad ?? 0.002,
                });

                caja.body.tags = e.__tags || [];
                caja.body.peso = true;

                caja.body.iid = e.iid;
                caja.body.objetoVisual = caja;

                this.cajas.push(caja.body);
            });
    }

    // ----------------------------------------------------
    buscarCapa(nivel, identificador) {
        return nivel.layerInstances.find(
            (l) => l.__identifier === identificador
        );
    }

    crearMundo(datosLDtk) {
        datosLDtk.levels.forEach((nivel) => {
            this.crearCapasVisuales(nivel);
            this.crearColisiones(nivel);
            this.crearCurvas(nivel);
            this.crearCajas(nivel);
            this.crearPlantas(nivel);
            this.crearCheckpoints(nivel);
            this.activarBoton(nivel);
            this.crearPuerta(nivel);
            this.crearFinNivel(nivel);
        });
    }

    // ========================================================
    // FONDO DEL CIELO
    // ========================================================
    crearFondo() {
        const imagenCielo = this.textures.get("cielo").getSourceImage();
        const anchoImg = imagenCielo.width;
        const altoImg = imagenCielo.height;

        // Textura espejada (original + copia volteada) para que no se vea costura.
        if (!this.textures.exists("cielo_espejo")) {
            const lienzo = this.textures.createCanvas(
                "cielo_espejo",
                anchoImg * 2,
                altoImg
            );

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
            .tileSprite(
                0,
                0,
                this.cameras.main.width,
                altoImg * this.escalaCielo,
                "cielo_espejo"
            )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(PROFUNDIDAD.CIELO);

        // Color de fondo = último píxel del cielo, para que no quede franja negra.
        const colorBorde = this.textures.getPixel(
            Math.floor(anchoImg / 2),
            altoImg - 1,
            "cielo"
        );

        if (colorBorde) {
            this.cameras.main.setBackgroundColor(colorBorde.color);
        }
    }

    // ========================================================
    // CAPAS VISUALES (Pastito, Pozito y Hierbas)
    // ========================================================
    crearCapasVisuales(nivel) {
        this.crearCapaTiles(
            nivel,
            CAPAS.PASTITO,
            "pastito_tiles",
            "pasto",
            PROFUNDIDAD.PASTO
        );

        this.crearCapaTiles(
            nivel,
            CAPAS.POZITO,
            "pozito_tiles",
            "pozo",
            PROFUNDIDAD.POZITO
        );

        this.crearCapaTiles(
            nivel,
            CAPAS.HIERBAS,
            "hierbas",
            "hierba",
            PROFUNDIDAD.HIERBAS
        );

        this.crearCapaTiles(
            nivel,
            CAPAS.PASTITO3,
            "suelo_nivel2",
            "suelo2",
            PROFUNDIDAD.PASTITO3
        );
    }

    crearCapaTiles(nivel, nombreCapa, claveTextura, prefijo, profundidad) {
        const capa = this.buscarCapa(nivel, nombreCapa);

        if (!capa) return;

        const textura = this.textures.get(claveTextura);

        capa.gridTiles.forEach((tile) => {
            const [srcX, srcY] = tile.src;
            const nombreFrame = `${prefijo}_${srcX}_${srcY}`;

            if (!textura.has(nombreFrame)) {
                textura.add(nombreFrame, 0, srcX, srcY, TAM_TILE, TAM_TILE);
            }

            const imagen = this.add
                .image(
                    tile.px[0] + nivel.worldX,
                    tile.px[1] + nivel.worldY,
                    claveTextura,
                    nombreFrame
                )
                .setOrigin(0, 0)
                .setDepth(profundidad);

            // LDtk guarda el espejado en bits: 1 = horizontal, 2 = vertical
            if (tile.f & 1) imagen.setFlipX(true);
            if (tile.f & 2) imagen.setFlipY(true);
        });
    }

    // ========================================================
    // CAPA DE COLISIONES: cuerpos estáticos en Matter
    // ========================================================
    crearColisiones(nivel) {
        const capa = this.buscarCapa(nivel, CAPAS.COLISIONES);
        if (!capa) return;

        const gridSize = capa.__gridSize;
        const anchoCeldas = capa.__cWid;
        const csv = capa.intGridCsv;
        const altoCeldas = capa.__cHei ?? Math.ceil(csv.length / anchoCeldas);

        const visitado = new Array(csv.length).fill(false);

        for (let cy = 0; cy < altoCeldas; cy++) {
            for (let cx = 0; cx < anchoCeldas; cx++) {
                const idx = cy * anchoCeldas + cx;
                const valor = csv[idx];
                const def = CUERPOS_INTGRID[valor];

                if (!def || visitado[idx]) continue;

                // Extender a lo ancho
                let w = 1;

                while (
                    cx + w < anchoCeldas &&
                    csv[idx + w] === valor &&
                    !visitado[idx + w]
                ) {
                    w++;
                }

                // Extender hacia abajo mientras toda la fila coincida
                let h = 1;

                crecer: while (cy + h < altoCeldas) {
                    for (let i = 0; i < w; i++) {
                        const j = (cy + h) * anchoCeldas + cx + i;

                        if (csv[j] !== valor || visitado[j]) break crecer;
                    }

                    h++;
                }

                for (let dy = 0; dy < h; dy++) {
                    for (let dx = 0; dx < w; dx++) {
                        visitado[(cy + dy) * anchoCeldas + cx + dx] = true;
                    }
                }

                this.crearBloque(
                    cx,
                    cy,
                    w,
                    h,
                    gridSize,
                    def,
                    nivel.worldX,
                    nivel.worldY
                );
            }
        }
    }

    crearBloque(cx, cy, w, h, gridSize, def, offsetX = 0, offsetY = 0) {
        const { color, borde, ...opciones } = def;

        const ancho = w * gridSize;
        const alto = h * gridSize;

        const posX = cx * gridSize + ancho / 2 + offsetX;
        const posY = cy * gridSize + alto / 2 + offsetY;

        if (color != null) {
            const bloque = this.add
                .rectangle(posX, posY, ancho, alto, color)
                .setStrokeStyle(1, borde ?? color)
                .setDepth(PROFUNDIDAD.PIEDRA);

            this.matter.add.gameObject(bloque, opciones);
        } else {
            this.matter.add.rectangle(posX, posY, ancho, alto, opciones);
        }
    }

    // ========================================================
    // NACIMIENTO DEL CARPINCHO
    // ========================================================
    crearCarpincho(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        const spawn = capaEntidades?.entityInstances.find(
            (e) => e.__identifier === "Spawn_carpincho"
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

        const inicioX = tienePosicionGuardada
            ? Number(guardado.pos_x)
            : spawn
                ? spawn.px[0] + spawn.width / 2 + nivel.worldX
                : 160;

        const inicioY = tienePosicionGuardada
            ? Number(guardado.pos_y)
            : spawn
                ? spawn.px[1] + spawn.height / 2 + nivel.worldY
                : 288;

        this.puntoRespawn = {
            x: inicioX,
            y: inicioY
        };

        prepararFramesCarpincho(this);

        this.carpincho = new wachin(
            this,
            inicioX,
            inicioY,
            "carpincho",
            iniciarCarpincho
        );

        this.carpincho.setDepth(PROFUNDIDAD.CARPINCHO);
    }

    // ========================================================
    // CÁMARA Y CONTROLES
    // ========================================================
    crearCamaraYControles(limites) {
        const cam = this.cameras.main;

        cam.setBounds(
            limites.x,
            limites.y,
            limites.ancho,
            limites.alto
        );

        cam.startFollow(this.carpincho, true, 0.08, 0.08);
        cam.setFollowOffset(0, 150);

        cam.centerOn(
            this.carpincho.x,
            this.carpincho.y - 150
        );

        this.teclas = this.input.keyboard.createCursorKeys();
        this.teclasWASD = this.input.keyboard.addKeys("W,A,S,D,SPACE");
    }

    // ========================================================
    // SUPERFICIES CURVAS (entidades "Curva" de LDtk)
    // ========================================================
    crearCurvas(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);
        const gridCurva = capaEntidades?.__gridSize ?? 16;

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Curva")
            .forEach((e) => {
                const campo = e.fieldInstances.find(
                    (f) => f.__identifier === "puntos"
                );

                if (!campo || !campo.__value) return;

                const pts = campo.__value
                    .filter((p) => p !== null)
                    .map((p) => ({
                        x: (p.cx + 0.5) * gridCurva + nivel.worldX,
                        y: p.cy * gridCurva + nivel.worldY,
                    }))
                    .sort((a, b) => a.x - b.x);

                crearSuperficieCurva(this, pts, {
                    grosor: 15,
                    subdivisiones: 8
                });
            });
    }

    calcularLimitesMundo(datosLDtk) {
        const niveles = datosLDtk.levels;

        const x = Math.min(...niveles.map((n) => n.worldX));
        const y = Math.min(...niveles.map((n) => n.worldY));

        const derecha = Math.max(
            ...niveles.map((n) => n.worldX + n.pxWid)
        );

        const abajo = Math.max(
            ...niveles.map((n) => n.worldY + n.pxHei)
        );

        return {
            x,
            y,
            ancho: derecha - x,
            alto: abajo - y
        };
    }
}
