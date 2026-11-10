import Phaser, { Scene } from "phaser";
import wachin from "../entidades/clases/wachin.js";
import { iniciarCarpincho, prepararFramesCarpincho } from "../entidades/personajes/carpincho.js";
import { crearSuperficieCurva } from "../utilidades/superficiesCurvas.js";
import { TAM_TILE, CAPAS, CUERPOS_INTGRID, PROFUNDIDAD } from "../configs/constantes.js";

// Propias de esta escena
const CLAVE_NIVEL = "nivel_0"; // key en el caché de Phaser
const ID_NIVEL = "Level_0"; // sala de la que sale el spawn del carpincho

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
        this.load.image("suelo_nivel2", url + "suelo_de_nivel2.png");
        this.load.image("flor_espinas", url + "florecitas.png")
        this.load.image('textura_caja', url + 'caja.png');

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
    }

    create() {
        const datosLDtk = this.cache.json.get(CLAVE_NIVEL);
        const nivel = datosLDtk.levels.find((l) => l.identifier === ID_NIVEL) || datosLDtk.levels[0];
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);

        // Límites físicos del mundo en Matter
        const limites = this.calcularLimitesMundo(datosLDtk);
        this.matter.world.setBounds(limites.x, limites.y, limites.ancho, limites.alto);


        this.crearMundo(datosLDtk);
        this.crearFondo();
        this.crearCarpincho(nivel);
        this.crearCamaraYControles(limites);

        console.log(
            this.buscarCapa(datosLDtk.levels[1], CAPAS.ENTIDADES)
                .entityInstances.find((e) => e.__identifier === "Planta_espinas"
                )
        );

    }

    update(tiempo, delta) {
        if (!this.carpincho) return;

        this.carpincho.mover(this.teclas, this.teclasWASD, delta);
        this.carpincho.adaptarSueloCarpincho(delta);

        // --- Zoom y encuadre dinámico en el tramo de la bajada ---
        const cam = this.cameras.main;
        const enTramoBajada = this.carpincho.x > 1850 && this.carpincho.x < 2700;

        // Si entra al tramo, acercamos el zoom a 1.35; si sale, vuelve a 1
        const zoomObjetivo = enTramoBajada ? 1.35 : 1;
        const offsetYObjetivo = enTramoBajada ? 90 : 110; // Levanta la vista para no mostrar debajo de Level_0

        cam.setZoom(Phaser.Math.Linear(cam.zoom, zoomObjetivo, 0.05));
        cam.followOffset.y = Phaser.Math.Linear(cam.followOffset.y, offsetYObjetivo, 0.05);

        // Parallax del cielo
        if (this.fondoCielo) {
            this.fondoCielo.tilePositionX = cam.scrollX * 0.2;
        }
    }

    // ========================================================
    // HELPERS
    // =======================================================

    crearPlantas(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES)
        capaEntidades?.entityInstances.filter((e) => e.__identifier === "Planta_espinas").forEach((e) => {
            const ancho = e.width;
            const alto = e.height;

            const posicion = { x: e.px[0] + nivel.worldX + ancho / 2, y: e.px[1] + nivel.worldY + alto / 2 }

            const campos = Object.fromEntries(e.fieldInstances.map((f) => [f.__identifier, f.__value]));
            if (!e.__tile) return;

            const { x: recorteX, y: recorteY, w: recorteW, h: recorteH } = e.__tile;

            const plantaTexture = this.textures.get('flor_espinas')
            const framePlanta = `${recorteX}_${recorteY}_${recorteW}_${recorteH}`

            if (!plantaTexture.has(framePlanta)) {
                plantaTexture.add(framePlanta, 0, recorteX, recorteY, recorteW, recorteH);
            }

            const planta = this.matter.add.image(posicion.x, posicion.y, 'flor_espinas', framePlanta)

            planta.setDisplaySize(ancho, alto);
            planta.setDepth(PROFUNDIDAD.CARPINCHO);

            planta.setRectangle(ancho, alto, {
                isSensor: campos.es_sensor,
                label: campos.label,
                isStatic: true
            });

        })
    }

    crearCajas(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES)


        capaEntidades?.entityInstances.filter((e) => e.__identifier === "Caja").forEach((e) => {
            const ancho = e.width;
            const alto = e.height;

            const posicion = { x: e.px[0] + nivel.worldX, y: e.px[1] + nivel.worldY }
            const campos = Object.fromEntries(e.fieldInstances.map((f) => [f.__identifier, f.__value]));

            if (!campos.cajita_tile) return;

            const { x: recorteX, y: recorteY, w: recorteW, h: recorteH } = campos.cajita_tile;

            const cajaTexturas = this.textures.get('textura_caja')
            const cajaFrame = `${recorteX}_${recorteY}_${recorteW}_${recorteH}`

            if (!cajaTexturas.has(cajaFrame)) {
                cajaTexturas.add(cajaFrame, 0, recorteX, recorteY, recorteW, recorteH);
            }

            const caja = this.matter.add.image(posicion.x, posicion.y, 'textura_caja', cajaFrame)

            caja.setDisplaySize(ancho, alto);
            caja.setDepth(PROFUNDIDAD.CARPINCHO);

            caja.setRectangle(ancho, alto, {
                friction: 0.5,
                label: campos.label,
                density: campos.densidad ?? 0.002
            });

        })

    }
    // ----------------------------------------------------
    buscarCapa(nivel, identificador) {
        return nivel.layerInstances.find((l) => l.__identifier === identificador);
    }

    crearMundo(datosLDtk) {
        datosLDtk.levels.forEach((nivel) => {

            this.crearCapasVisuales(nivel);
            this.crearColisiones(nivel);
            this.crearCurvas(nivel);
            this.crearCajas(nivel)
            this.crearPlantas(nivel)
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
        this.crearCapaTiles(nivel, CAPAS.PASTITO3, "suelo_nivel2", "suelo2", PROFUNDIDAD.PASTITO3);

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
                .image(tile.px[0] + nivel.worldX, tile.px[1] + nivel.worldY, claveTextura, nombreFrame)
                .setOrigin(0, 0)
                .setDepth(profundidad);

            // LDtk guarda el espejado en bits: 1 = horizontal, 2 = vertical
            if (tile.f & 1) imagen.setFlipX(true);
            if (tile.f & 2) imagen.setFlipY(true);
        });
    }

    // ========================================================
    // CAPA DE COLISIONES: cuerpos estáticos en Matter
    // Las celdas contiguas del mismo tipo se fusionan en
    // rectángulos grandes (sin costuras).
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
                if (!def || visitado[idx]) continue; // vacío, sin definición o ya fusionada

                // Extender a lo ancho...
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

                this.crearBloque(cx, cy, w, h, gridSize, def, nivel.worldX, nivel.worldY);
            }
        }
    }

    // Crea un cuerpo (con dibujo opcional) que cubre w x h celdas desde (cx, cy)
    crearBloque(cx, cy, w, h, gridSize, def, offsetX = 0, offsetY = 0) {
        const { color, borde, ...opciones } = def;
        const ancho = w * gridSize;
        const alto = h * gridSize;
        const posX = cx * gridSize + ancho / 2 + offsetX;
        const posY = cy * gridSize + alto / 2 + offsetY;

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
    crearCarpincho(nivel) {
        const capaEntidades = this.buscarCapa(nivel, CAPAS.ENTIDADES);
        const spawn = capaEntidades?.entityInstances.find((e) => e.__identifier === "Spawn_carpincho");

        const inicioX = spawn ? spawn.px[0] + spawn.width / 2 + nivel.worldX : 160;
        const inicioY = spawn ? spawn.px[1] + spawn.height / 2 + nivel.worldY : 288;

        this.puntoRespawn = { x: inicioX, y: inicioY };

        // Normaliza los frames (48x48, pies alineados) ANTES de crear al carpincho
        prepararFramesCarpincho(this);
        this.carpincho = new wachin(this, inicioX, inicioY, "carpincho", iniciarCarpincho);
        this.carpincho.setDepth(PROFUNDIDAD.CARPINCHO);
    }

    // ========================================================
    // CÁMARA Y CONTROLES
    // ========================================================
    crearCamaraYControles(limites) {
        const cam = this.cameras.main;

        cam.setBounds(limites.x, limites.y, limites.ancho, limites.alto);
        cam.startFollow(this.carpincho, true, 0.08, 0.08);
        cam.setFollowOffset(0, 150);

        cam.centerOn(this.carpincho.x, this.carpincho.y - 150);

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
                const campo = e.fieldInstances.find((f) => f.__identifier === "puntos");
                if (!campo || !campo.__value) return;

                const pts = campo.__value
                    .filter((p) => p !== null)
                    .map((p) => ({
                        x: (p.cx + 0.5) * gridCurva + nivel.worldX,
                        y: p.cy * gridCurva + nivel.worldY,
                    }))
                    .sort((a, b) => a.x - b.x);

                crearSuperficieCurva(this, pts, { grosor: 15, subdivisiones: 8 });
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
}