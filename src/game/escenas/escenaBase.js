import Phaser, { Scene } from "phaser";

import { SONIDOS_CONTACTO, PROFUNDIDAD } from "../configs/constantes.js";
import { crearCapasVisuales } from "../sistemas/capasVisuales.js";
import { crearColisiones } from "../sistemas/colisiones.js";
import { crearCurvas } from "../sistemas/curvas.js";
import { crearCajas } from "../sistemas/cajas.js";
import { crearPlantas } from "../sistemas/plantas.js";
import { crearCheckpoints } from "../sistemas/checkpoints.js";
import { crearBotones } from "../sistemas/botones.js";
import { crearPuertas } from "../sistemas/puertas.js";
import { crearFinNivel } from "../sistemas/finNivel.js";

export default class EscenaBase extends Scene {
    constructor(clave, claveJson, idNivelLDtk, guardadoInicial = null) {
        super(clave);
        this.claveJson = claveJson;
        this.idNivelLDtk = idNivelLDtk;
        this.guardadoInicial = guardadoInicial;

        // Estado compartido por todos los sistemas
        this.puertas = [];
        this.botones = [];
        this.cajas = [];
        this.carpincho = null;
        this.puntoRespawn = null;
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

        this.crearMundo(this.datosLDtk);   // por ahora definido en cada nivel
        this.aplicarEstadoObjetos();
        this.crearFondo();                 // por ahora definido en cada nivel
        this.crearPersonaje(this.nivel);   // gancho: cada nivel elige personaje

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
        if (!this.carpincho) return;
        this.carpincho.mover(this.teclas, this.teclasWASD, delta);
        this.carpincho.adaptarSueloCarpincho(delta);
        this.alActualizar(tiempo, delta);
    }

    // ---------- Ganchos (vacíos por defecto) ----------
    alCrear() { }
    alActualizar(tiempo, delta) { }

    // ---------- Helpers ----------
    buscarCapa(nivel, identificador) {
        return nivel.layerInstances.find((l) => l.__identifier === identificador);
    }

    calcularLimitesMundo(datosLDtk) {
        const niveles = datosLDtk.levels;
        const x = Math.min(...niveles.map((n) => n.worldX));
        const y = Math.min(...niveles.map((n) => n.worldY));
        const derecha = Math.max(...niveles.map((n) => n.worldX + n.pxWid));
        const abajo = Math.max(...niveles.map((n) => n.worldY + n.pxHei));
        return { x, y, ancho: derecha - x, alto: abajo - y };
    }

    // ---------- Guardado ----------
    capturarEstado() {
        if (!this.carpincho) return null;

        return {
            pos_x: Math.round(this.carpincho.x),
            pos_y: Math.round(this.carpincho.y),
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

    reaparecerCarpincho() {
        const { x, y } = this.puntoRespawn;
        this.carpincho.setPosition(x, y);
        this.carpincho.setVelocity(0, 0);
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
        // Pegá acá tal cual tu resolverInteraccion actual (procesarColision se elimina)
    }
}