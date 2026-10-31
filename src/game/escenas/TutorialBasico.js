import { Scene } from "phaser";
import wachin from "../entidades/wachin.js";
import Agua from "../entidades/agua.js";
import { iniciarCarpincho, prepararFramesCarpincho } from "../entidades/carpincho.js";
import { crearSuperficieCurva } from "../utilidades/superficiesCurvas.js";

// ============================================================
// CONSTANTES
// ============================================================

// Nivel
const CLAVE_NIVEL = "nivel_0"; // key en el caché de Phaser
const ID_NIVEL = "Level_0"; // identifier del nivel en LDtk
const TAM_TILE = 16; // tamaño (px) de cada tile de los tilesets

// Capas de LDtk
const CAPAS = {
    PASTITO: "Pastito",
    POZITO: "Pozito",
    HIERBAS: "Hierbas",
    COLISIONES: "Colisiones",
    ENTIDADES: "Entidades",
};

// Valores de la capa IntGrid "Colisiones"
const INTGRID = {
    PISO: 1,
    AGUA: 2,
    ROCA: 3,
    TRONCO: 4
};

// Cuerpos Matter que genera cada valor del IntGrid.
// Para sumar un bloque nuevo: agregá su valor en INTGRID y una línea acá.
// (El agua no va acá: la maneja la clase Agua.)
// Los cuerpos estáticos contiguos del mismo tipo se fusionan en uno solo.
const CUERPOS_INTGRID = {
    [INTGRID.PISO]: { isStatic: true, friction: 0.1, label: 'suelo' },
    [INTGRID.CAJA]: { isStatic: false, friction: 0, label: 'caja' },
    [INTGRID.ROCA]: { isStatic: true, friction: 0.1, label: 'roca', color: 0x8d8d8d, borde: 0x4a4a4a },
    [INTGRID.TRONCO]: { isStatic: true, friction: 0.1, label: 'tronco', color: 0x8b5a2b, borde: 0x4e3218 },
};

const SONIDOS_CONTACTO = {
    // roca:   { clave: "golpe_roca",   archivo: "/assets/audio/golpe_roca.mp3" },
    // tronco: { clave: "golpe_madera", archivo: "/assets/audio/golpe_madera.mp3" },
    // para cuando toque ponerle sonidos a los bloques de colision perrito
};

// Orden de dibujado (mayor = más adelante)
const PROFUNDIDAD = {
    CIELO: -100,
    PASTO: 0,
    CARPINCHO: 0,
    PIEDRA: 1,
    HIERBAS: 5,
    AGUA: 5,
    POZITO: 7,
};

// ============================================================
// ESCENA
// ============================================================
export default class TutorialBasico extends Scene {
    constructor() {
        super("tutorialBasico");
    }

    preload() {
        const url = "/assets/sprites/escenario/";
        const url2 = "/assets/sprites/carpincho/";

        this.load.image("cielo", url + "background-cielo.png");
        this.load.image("pastito_tiles", url + "pastitio.png");
        this.load.image("pozito_tiles", url + "pastito-pozito.png");
        this.load.image("hierbas", url + "pastito-pozito-con-hievas.png");

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

        if (!this.textures.exists("gota")) {
            const gotaCanvas = this.textures.createCanvas("gota", 6, 6);
            const ctx = gotaCanvas.getContext();
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(3, 3, 3, 0, Math.PI * 2);
            ctx.fill();
            gotaCanvas.refresh();
        }

        // Audio de contactos (la tabla está vacía hasta que haya archivos)
        Object.values(SONIDOS_CONTACTO).forEach(({ clave, archivo }) => {
            this.load.audio(clave, archivo);
        });
    }

    create() {
        const datosLDtk = this.cache.json.get(CLAVE_NIVEL);
        const nivel = datosLDtk.levels.find((l) => l.identifier === ID_NIVEL) || datosLDtk.levels[0];
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        // Límites físicos del mundo en Matter
        this.matter.world.setBounds(0, 0, nivel.pxWid, nivel.pxHei);

        this.crearFondo();
        this.crearCapasVisuales(nivel);
        this.crearColisiones(nivel);
        this.crearCarpincho(capaEntidades);
        this.crearCamaraYControles(nivel);
        this.carpincho.on("aterrizar", this.reproducirSonidoContacto, this);
        this.crearCurvas(capaEntidades);

        this.textoFps = this.add.text(8, 8, "", { color: "#084d27" }).setScrollFactor(0).setDepth(1000);
    }

    update(tiempo, delta) {
        if (!this.carpincho) return;

        // 1) Olas + flotabilidad y arrastre sobre el carpincho
        if (this.agua) {
            this.agua.actualizar(tiempo, delta);
            this.agua.afectarCuerpo(this.carpincho, tiempo, delta);
        }

        // 2) Controles del carpincho (leen la sumersión que dejó el agua)
        this.carpincho.mover(this.teclas, this.teclasWASD, delta);
        // 2b) Inclinar al carpincho según la pendiente
        this.carpincho.adaptarSueloCarpincho(delta);

        // 3) Parallax del cielo
        if (this.fondoCielo) {
            this.fondoCielo.tilePositionX = this.cameras.main.scrollX * 0.2;
        }

        this.textoFps.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`).setOrigin(-9.0, -0.3);

        // 4) Sensores laterales (debug): imprime el label cuando cambia
        const { izquierda, derecha, suelo } = this.carpincho.sensores;

        if (izquierda.labelContacto !== izquierda.estadoAnterior) {
            console.log("Sensor izquierdo:", izquierda.labelContacto ?? "nada");
            izquierda.estadoAnterior = izquierda.labelContacto;
        }

        if (derecha.labelContacto !== derecha.estadoAnterior) {
            console.log("Sensor derecho:", derecha.labelContacto ?? "nada");
            derecha.estadoAnterior = derecha.labelContacto;
        }

        if (suelo.labelContacto !== suelo.estadoAnterior) {
            console.log("Sensor de suelo:", suelo.labelContacto ?? "nada");
            suelo.estadoAnterior = suelo.labelContacto;
        }

        console.log(
            this.carpincho.sensores.suelo.labelContacto,
            this.carpincho.anguloObjetivo.toFixed(2),
            this.carpincho.body.angle.toFixed(2)
        );
    }

    // ========================================================
    // HELPERS
    // ========================================================
    buscarCapa(nivel, identificador) {
        return nivel.layerInstances.find((l) => l.__identifier === identificador);
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

    // ========================================================
    // CAPAS VISUALES (Pastito, Pozito y Hierbas)
    // ========================================================
    crearCapasVisuales(nivel) {
        this.crearCapaTiles(nivel, CAPAS.PASTITO, "pastito_tiles", "pasto", PROFUNDIDAD.PASTO);
        this.crearCapaTiles(nivel, CAPAS.POZITO, "pozito_tiles", "pozo", PROFUNDIDAD.POZITO);
        this.crearCapaTiles(nivel, CAPAS.HIERBAS, "hierbas", "hierba", PROFUNDIDAD.HIERBAS);
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
                .image(tile.px[0], tile.px[1], claveTextura, nombreFrame)
                .setOrigin(0, 0)
                .setDepth(profundidad);

            // LDtk guarda el espejado en bits: 1 = horizontal, 2 = vertical
            if (tile.f & 1) imagen.setFlipX(true);
            if (tile.f & 2) imagen.setFlipY(true);
        });
    }

    // ========================================================
    // CAPA DE COLISIONES: cuerpos en Matter + Agua
    // Las celdas estáticas contiguas del mismo tipo se fusionan en
    // rectángulos grandes (sin costuras). Las dinámicas van de a una.
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
                if (!def || visitado[idx]) continue; // vacío, agua o ya fusionada

                // Celdas dinámicas (cajas): una por una, sin fusionar
                if (!def.isStatic) {
                    visitado[idx] = true;
                    this.crearBloque(cx, cy, 1, 1, gridSize, def);
                    continue;
                }

                // Estáticas: extender a lo ancho...
                let w = 1;
                while (cx + w < anchoCeldas && csv[idx + w] === valor && !visitado[idx + w]) w++;

                // ...y luego hacia abajo mientras toda la fila coincida
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

                this.crearBloque(cx, cy, w, h, gridSize, def);
            }
        }

        this.agua = new Agua(this, {
            intGrid: csv,
            columnas: anchoCeldas,
            filas: altoCeldas,
            tamCelda: gridSize,
            valorAgua: INTGRID.AGUA,
            profundidad: PROFUNDIDAD.AGUA,
        });
    }

    // Crea un cuerpo (con dibujo opcional) que cubre w x h celdas desde (cx, cy)
    crearBloque(cx, cy, w, h, gridSize, def) {
        const { color, borde, ...opciones } = def;
        const ancho = w * gridSize;
        const alto = h * gridSize;
        const posX = cx * gridSize + ancho / 2;
        const posY = cy * gridSize + alto / 2;

        if (color != null) {
            // Rectángulo visible + cuerpo Matter atados entre sí
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
    crearCarpincho(capaEntidades) {
        const spawn = capaEntidades?.entityInstances.find((e) => e.__identifier === "Spawn_carpincho");
        const inicioX = spawn ? spawn.px[0] : 160;
        const inicioY = spawn ? spawn.px[1] : 288;

        // Normaliza los frames (48x48, pies alineados) ANTES de crear al carpincho
        prepararFramesCarpincho(this);
        this.carpincho = new wachin(this, inicioX, inicioY, "carpincho", iniciarCarpincho);
        this.carpincho.setDepth(PROFUNDIDAD.CARPINCHO);
    }

    // ========================================================
    // CÁMARA Y CONTROLES
    // ========================================================
    crearCamaraYControles(nivel) {
        this.cameras.main.setBounds(0, 0, nivel.pxWid, nivel.pxHei);
        this.cameras.main.startFollow(this.carpincho, true, 0.08, 0.08);
        this.cameras.main.setFollowOffset(0, -100);

        this.teclas = this.input.keyboard.createCursorKeys();
        this.teclasWASD = this.input.keyboard.addKeys("W,A,S,D,SPACE");
    }

    // ========================================================
    // SUPERFICIES CURVAS (entidades "Curva" de LDtk)
    // ========================================================
    crearCurvas(capaEntidades) {
        const gridCurva = capaEntidades?.__gridSize ?? 16;

        capaEntidades?.entityInstances
            .filter((e) => e.__identifier === "Curva")
            .forEach((e) => {
                const campo = e.fieldInstances.find((f) => f.__identifier === "puntos");
                if (!campo || !campo.__value) return;

                const pts = campo.__value
                    .filter((p) => p !== null)
                    .map((p) => ({
                        x: (p.cx + 0.5) * gridCurva,
                        y: p.cy * gridCurva,
                    }))
                    .sort((a, b) => a.x - b.x);

                crearSuperficieCurva(this, pts, { grosor: 24, subdivisiones: 8 });
            });
    }

    reproducirSonidoContacto(label) {
        const config = SONIDOS_CONTACTO[label];
        if (!config || !this.cache.audio.exists(config.clave)) return; // sin sonido configurado
        this.sound.play(config.clave);
    }
}