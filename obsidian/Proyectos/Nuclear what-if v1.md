---
tags: [proyecto, what-if, prueba]
fecha: 2026-11-08
estado: entregado (prueba)
---
# What if a nuclear bomb went off 6 miles away? (prueba del formato what-if)

Hecho con la [[Receta what-if]]: un solo plano desde un balcón, **sin voz**, contador "TIME SINCE DETONATION" con "TIME SLOWED DOWN / SPED UP", contador secundario ("BLAST ARRIVES IN", "WIND 78 MPH", "CLOUD TOP 11.8 MILES"), frase serif cada ~4 s, tarjeta final.

Escalada: cuenta atrás → destello → pulso de calor → silencio → se ve venir la onda → todos los vidrios estallan → viento inverso → nube a 12 millas → incendios → "And this was just one bomb." → "There are about 12,000 nuclear warheads on Earth today."

## Datos usados (1 Mt en altura, observador a 10 km = 6.2 mi)
- Onda: Glasstone & Dolan, 1 Mt a 6,500 ft: frente a ~5.1 km a los 11 s y ~15.3 km a los 37 s → **~23 s a 10 km** (interpolado).
- Quemaduras de 3er grado hasta ~12–13 km (NUKEMAP 1.2 Mt: 13.2 km) → "Exposed skin burns, even out here".
- Viento tras el frente a ~2 psi ≈ 70 mph (orden de magnitud de Glasstone; a 5 km ~180 mph).
- El vidrio volando es la principal causa de heridas a baja presión (Glasstone).
- Nube: se estabiliza a ~19 km (~12 mi) en ~10 min.
- Arsenal: ~12,187 cabezas (FAS, inicio de 2026) → "about 12,000".
Supuestos simplificados: bola de fuego de ~0.9 km de radio; altura de explosión 3 km.

Ver [[No verificado]].

## Resultado medido
- 51.5 s, 1080×1920, 30 fps, 1545 frames (~40 min de render con GPU por software).
- Archivos: `nuclear_whatif_ligero.mp4` (14 MB) y `nuclear_whatif_HQ.mp4` (274 MB).
- Audio: −14.4 LUFS, pico −2.1 dBFS (MP4). Sección más fuerte = la onda (−12.9 dB RMS); calor −21, espera −17, final −19.5.
- Antes del arreglo la onda quedaba **por debajo** de la nube: el pico tan grande hacía que loudnorm pasara a modo dinámico → se añadió un limitador suave.
