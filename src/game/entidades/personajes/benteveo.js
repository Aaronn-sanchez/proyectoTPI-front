import Phaser from "phaser";

// ==========================================================
// BENTEVEO
// Vuelo estilo "floppy": gravedad propia, un aleteo por pulsación,
// planeo al mantener la tecla y control horizontal.
// Todos los números de jugabilidad están acá arriba para ajustarlos.
// Las unidades son las de Matter: px por paso de física (~16.7 ms).
// ==========================================================
const TAM = 78;               // celda (px) del sprite normalizado
const ANCHO_CUERPO = 40;      // hitbox
const ALTO_CUERPO = 28;

const GRAVEDAD = 0.45;        // se suma a la velocidad vertical en cada paso
const FUERZA_ALETEO = -8.5;   // velocidad vertical que da cada aleteo
const CAIDA_MAXIMA = 11;
const VELOCIDAD_PLANEO = 2.5; // tope de caída al mantener la tecla (Infinity = sin planeo)

const VELOCIDAD_MAX_X = 6;
const ACELERACION_X = 0.4;
const FRENADO_X = 0.94;       // más cerca de 1 = frena más lento
const AVANCE_AUTOMATICO = 0;  // > 0: avanza solo a esa velocidad (floppy bird puro)

// ==========================================================
// FRAMES
// Igual que con el carpincho: se normaliza la textura a TAM x TAM, así el
// hitbox no depende del tamaño del dibujo y se puede cambiar el arte sin romper nada.
// Llamar UNA vez en crearPersonaje(), antes de crear al benteveo.
// ==========================================================
export function prepararFramesBenteveo(scene) {
    for (let i = 1; i <= 5; i++) {
        const clave = `bv_benteveo_${i}`;

        if (scene.textures.exists(clave)) continue;

        const img = scene.textures.get(`benteveo_${i}`).getSourceImage();

        const escala = Math.min(TAM / img.width, TAM / img.height);
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);

        const lienzo = scene.textures.createCanvas(clave, TAM, TAM);
        const ctx = lienzo.getContext();

        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(
            img,
            Math.round((TAM - w) / 2),
            Math.round((TAM - h) / 2),
            w,
            h
        );

        lienzo.refresh();
    }
}
// ==========================================================
// INICIO (se le pasa a wachin como iniciarEntidad)
// ==========================================================
export function iniciarBenteveo(personaje) {

    const Matter = Phaser.Physics.Matter.Matter;
    const { x, y } = personaje;
    // Vuela: el agua no lo flota ni lo frena (ver sistemas/agua.js)
    personaje.ignoraAgua = true;

    personaje.setTexture("bv_benteveo_1");

    if (!personaje.scene.anims.exists("vuelo_benteveo")) {
        personaje.scene.anims.create({
            key: "vuelo_benteveo",
            frames: [
                { key: "bv_benteveo_1" },
                { key: "bv_benteveo_2" },
                { key: "bv_benteveo_3" },
                { key: "bv_benteveo_4" },
                { key: "bv_benteveo_5" },
            ],
            frameRate: 8,
            repeat: -1,
        });

        // dentro de iniciarBenteveo:
personaje.factorVelocidad = 1;
personaje.factorGravedad = 1;

// dentro de mover():
const vMax = VELOCIDAD_MAX_X * this.factorVelocidad;
const acel = ACELERACION_X * this.factorVelocidad;
// ...
vx = AVANCE_AUTOMATICO * this.factorVelocidad;                          // en la rama de avance automático
vx = Phaser.Math.Clamp(vx + dir * acel * paso, -vMax, vMax);            // en la rama normal
// ...
let vy = this.body.velocity.y + GRAVEDAD * this.factorGravedad * paso;
    }

    personaje.play("vuelo_benteveo");

    const cuerpo = Matter.Bodies.rectangle(x, y, ANCHO_CUERPO, ALTO_CUERPO, {
        friction: 0,
        frictionStatic: 0,
        frictionAir: 0,
        restitution: 0,
        chamfer: { radius: 8 },
    });

    personaje.setExistingBody(cuerpo);
    personaje.setFixedRotation();
    personaje.setPosition(x, y);
    personaje.setOrigin(0.5, 0.5);
    personaje.setIgnoreGravity(true);   // la gravedad la aplica mover(), a mano

    // ==========================================================
    // AVISO DE GOLPES
    // El benteveo no decide qué pasa al chocar: emite "golpe" cuando toca
    // cualquier cosa sólida y el nivel resuelve (reaparecer, restar vida, etc.).
    // Los sensores (nubes, checkpoints) no cuentan: ya los maneja EscenaBase.
    // ==========================================================
    const mundo = personaje.scene.matter.world;
    const esPropio = (b) => b === cuerpo || b.parent === cuerpo;

    const alColisionar = (evento) => {
        const muros = Object.values(mundo.walls ?? {});   // bordes del mundo: no matan

        for (const { bodyA, bodyB } of evento.pairs) {
            let otro;
            if (esPropio(bodyA)) otro = bodyB;
            else if (esPropio(bodyB)) otro = bodyA;
            else continue;

            if (otro.isSensor || muros.includes(otro)) continue;

            personaje.emit("golpe", otro.label);
            return;
        }
    };

    mundo.on("collisionstart", alColisionar);
    personaje.once("destroy", () => mundo.off("collisionstart", alColisionar));

    // ==========================================================
    // MOVIMIENTO
    // ==========================================================
    personaje.mover = function (teclas, teclasWASD, delta) {
        const justDown = Phaser.Input.Keyboard.JustDown;

        const izq = teclas.left.isDown || teclasWASD.A.isDown;
        const der = teclas.right.isDown || teclasWASD.D.isDown;
        const aleteo = justDown(teclas.up) || justDown(teclasWASD.W) || justDown(teclasWASD.SPACE);
        const mantiene = teclas.up.isDown || teclasWASD.W.isDown || teclasWASD.SPACE.isDown;

        const paso = delta / 16.67;

        // ---- Horizontal ----
        let vx = this.body.velocity.x;

        if (AVANCE_AUTOMATICO > 0) {
            vx = AVANCE_AUTOMATICO;
        } else {
            const dir = (der ? 1 : 0) - (izq ? 1 : 0);

            if (dir !== 0) {
                vx = Phaser.Math.Clamp(vx + dir * ACELERACION_X * paso, -VELOCIDAD_MAX_X, VELOCIDAD_MAX_X);
                this.setFlipX(dir < 0);
            } else {
                vx = Math.abs(vx) < 0.1 ? 0 : vx * Math.pow(FRENADO_X, paso);
            }
        }

        // ---- Vertical ----
        let vy = this.body.velocity.y + GRAVEDAD * paso;

        if (aleteo) {
            vy = FUERZA_ALETEO;
        } else if (mantiene && vy > VELOCIDAD_PLANEO) {
            vy = VELOCIDAD_PLANEO;
        }

        vy = Math.min(vy, CAIDA_MAXIMA);

        this.setVelocity(vx, vy);
    };
}