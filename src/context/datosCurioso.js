// Datos curiosos que se muestran en la pantalla de carga.
// Tip: mantené cada texto en ~105 caracteres o menos para que entre en la nube.

export const DATOS_CURIOSOS = [
    // --- Carpinchos ---
    "¡Sabías que los carpinchos que viven en cautiverio o bajo cuidado, pueden vivir hasta los 15 años!",
    "¡Sabías que el carpincho es el roedor más grande del mundo y puede superar los 60 kilos!",
    "¡Sabías que los carpinchos pueden aguantar bajo el agua hasta cinco minutos?",
    "¡Sabías que los ojos y la nariz del carpincho están arriba de su cabeza para asomarse al nadar!",
    "¡Sabías que los carpinchos tienen pequeñas membranas entre los dedos que los ayudan a nadar!",
    "¡Sabías que los carpinchos viven en grupos familiares de entre 10 y 20 individuos!",
    "¡Sabías que los dientes del carpincho nunca dejan de crecer?",
    "¡Sabías que el carpincho puede dormir dentro del agua con la nariz afuera!",
    "¡Sabías que los carpinchos pueden correr a más de 30 km/h cuando se asustan!",
    "¡Sabías que los carpinchos son herbívoros y comen pastos y plantas acuáticas!",
    "¡Sabías que los carpinchos están más activos al amanecer y al atardecer!",
    "¡Sabías que en la naturaleza los carpinchos suelen vivir entre 8 y 10 años!",
    "¡Sabías que varias aves se posan sobre los carpinchos para comer insectos y parásitos!",
    "¡Sabías que los carpinchos se comunican con silbidos, ladridos y chasquidos!",
    "¡Sabías que la palabra carpincho viene del guaraní y significa «señor de las hierbas»!",

    // --- Benteveo ---
    "¡Sabías que el benteveo se llama así por su canto, que suena como «bien-te-veo»!",
    "¡Sabías que el benteveo come insectos, frutas e incluso pequeños peces!",

    // --- Humedales y ecosistema ---
    "¡Sabías que los humedales funcionan como esponjas y ayudan a evitar inundaciones!",
    "¡Sabías que los humedales limpian el agua filtrando sedimentos y contaminantes!",
    "¡Sabías que los Esteros del Iberá son uno de los humedales más grandes de Sudamérica!",
    "¡Sabías que los camalotes son plantas flotantes que sirven de refugio a muchos animales!",
    "¡Sabías que cuidar los humedales protege a cientos de especies de plantas y animales!",
];

// Devuelve un dato al azar. Si le pasás el último mostrado, evita repetirlo.
export function obtenerDatoAlAzar(anterior = null) {
    if (DATOS_CURIOSOS.length <= 1) return DATOS_CURIOSOS[0] ?? '';

    let dato;
    do {
        dato = DATOS_CURIOSOS[Math.floor(Math.random() * DATOS_CURIOSOS.length)];
    } while (dato === anterior);

    return dato;
}