#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""LO QUE SE EMPUJA A UN REPO PUBLICO, BARRIDO EN BUSCA DE CORRESPONDENCIA.

  Copyright (c) 2026 Carles Marin. All rights reserved.
  Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)

Este repositorio ES PUBLICO.  Todo lo que no este ignorado se publica.

POR QUE EXISTE.  Regla permanente de Carles (2026-08-25): lo privado vive SIEMPRE en un directorio
aparte del que no pueda alcanzar nada publico.  Un sitio, no una lista de nombres.  Aqui el sitio es
`._privado/` y lo sostiene el glob `._*` del .gitignore.

Y hace falta un control ADEMAS del sitio, porque lo privado se cuela escrito DENTRO de un fichero
que nadie mira como correspondencia.  El 26 de agosto de 2026, en el arbol privado hermano,
`check_letter_map.py` --- una compuerta legitima, listada entre las demas, empaquetada con ellas ---
viajaba dentro de un zip ya publicado en Zenodo con el destinatario, la fecha del envio y lo que
prometia el texto enviado.  Aqui estuvo a punto de pasar lo mismo: el HANDOFF llego a nombrar un
envio concreto y su fecha, y HANDOFF.md se publica.

NOTA SOBRE SI MISMO.  Este guion se salta a si mismo, y por IDENTIDAD DE RUTA, no por nombre: tiene
que contener los patrones para funcionar, y una exclusion por nombre convertiria «llamate
check_privado.py» en la forma de esconder cualquier cosa.  Por lo mismo, su propio texto no nombra a
nadie ni fecha ningun envio: la unica forma de que un control no tenga que exceptuarse mucho es no
escribir dentro de el lo que persigue.

QUE NO ES UN ACIERTO.  Komori y Maru son los AUTORES del articulo que audita esta herramienta;
citarlos es obligatorio y aparece por todas partes.  Un nombre solo nunca basta.  Lo que dispara es
el CONTEXTO EPISTOLAR: que hubo una carta, una respuesta, una pregunta hecha en privado.

    python build/check_privado.py

VEREDICTO: codigo 1 si algo que se empujaria cita correspondencia, o si el propio sitio privado ha
dejado de estar ignorado.
"""
import io
import pathlib
import re
import subprocess
import sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
SITIO = "._privado"

CITA = [
    (r"\b(letters?|carta)\s+(to|a|from|de)\s+\w", "nombra una carta a alguien"),
    (r"\bin\s+(my|the)\s+(first|second|third|last|previous)\s+letter\b", "cita una carta propia"),
    (r"\b(wrote|written)\s+to\s+(him|her|them|prof|dr)", "dice que se escribio"),
    (r"\b(his|her|their)\s+(reply|answer|letter|e-?mail)\b", "la respuesta de un tercero"),
    (r"\b(replied|respondio|contesto|me\s+respond)", "hubo respuesta"),
    (r"\b(private|personal)\s+communication\b", "comunicacion privada"),
    (r"\bI\s+(asked|told|wrote)\s+(him|her|them|prof|dr)\b", "lo que le dijimos en privado"),
    (r"\bsu\s+(respuesta|carta|correo)\b", "posesivo epistolar"),
    (r"\ble\s+(dije|escribi|preguntamos|dijimos)\b", "posesivo epistolar"),
    (r"\bENVIADA_EN\b", "marca el commit de un envio"),
    (r"[\w.+-]+@(?!gmail\.com|example\.)[\w-]+\.[\w.]{2,}", "direccion de correo ajena"),
]

BINARIO = (".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".woff", ".woff2", ".ico")


def pushable():
    """todo lo que git empujaria: trackeado + sin trackear pero NO ignorado"""
    out = []
    for args in (["git", "ls-files"], ["git", "ls-files", "--others", "--exclude-standard"]):
        r = subprocess.run(args, cwd=str(ROOT), capture_output=True, text=True)
        out += [l.strip() for l in r.stdout.splitlines() if l.strip()]
    return sorted(set(out))


def line(ch="="):
    print(ch * 92)


print(__doc__.split("    python")[0])
fails = []

# ---------------------------------------------------------------- el sitio sigue ignorado?
line()
print("CONTROL A -- sigue el sitio privado fuera de lo que git empuja?")
line()
sonda = ROOT / SITIO / "_sonda_del_control.txt"
sonda.parent.mkdir(exist_ok=True)
sonda.write_text("una carta a un tercero, con su respuesta\n", encoding="utf-8")
try:
    vis = subprocess.run(["git", "ls-files", "--others", "--exclude-standard", "--", SITIO],
                         cwd=str(ROOT), capture_output=True, text=True).stdout.strip()
finally:
    sonda.unlink(missing_ok=True)
ok_a = not vis
print(f"   se escribe un fichero de prueba dentro de {SITIO}/ y se pregunta a git si lo empujaria")
print(f"   git lo ve: {vis or 'no'}   ->  {'PASS' if ok_a else '*** FAIL ***'}")
if not ok_a:
    fails.append("el sitio privado NO esta ignorado")
    print("   *** el glob `._*` del .gitignore no esta haciendo su trabajo ***")

# ---------------------------------------------------------------- el autotest, que puede fallar
line()
print("CONTROL B -- el barrido distingue una carta de una cita normal?")
line()
CULPABLE = "This was shipped in the letter to N. N. of 1 January, and his reply came the same day.\n"
INOCENTE = ("Komori & Maru, SU(7) Grand Gauge-Higgs Unification, arXiv:2503.04090; their eq. (68)\n"
            "and the decomposition of eq. (57) correspond to the same multiplets.\n")


def scan(text):
    out = []
    for pat, why in CITA:
        for m in re.finditer(pat, text, re.I):
            ln = text.count("\n", 0, m.start()) + 1
            out.append((why, ln, " ".join(text[max(0, m.start() - 40):m.end() + 40].split())))
    return out


hc, hi = scan(CULPABLE), scan(INOCENTE)
print(f"   la frase que el HANDOFF llego a tener .......... {len(hc)} aciertos "
      + ("PASS" if hc else "*** FAIL ***"))
print(f"   una cita normal del articulo auditado .......... {len(hi)} aciertos "
      + ("PASS" if not hi else "*** FAIL: acusa a una cita legitima ***"))
if not hc or hi:
    sys.exit("*** el control no es fiable; no se empuja nada hasta arreglarlo ***")

# ---------------------------------------------------------------- el barrido
line()
print("BARRIDO -- todo lo que git empujaria")
line()
hits, n = [], 0
for rel in pushable():
    if rel.lower().endswith(BINARIO):
        continue
    p = ROOT / rel
    if not p.is_file():
        continue
    # se salta a SI MISMO, por identidad de ruta y no por nombre: tiene que llevar los patrones
    # dentro para funcionar, y excluir por nombre haria de «llamate asi» un escondite
    if p.resolve() == pathlib.Path(__file__).resolve():
        continue
    try:
        t = p.read_text(encoding="utf-8", errors="replace")
    except OSError:
        continue
    n += 1
    for why, ln, frag in scan(t):
        hits.append((rel, ln, why, frag))

print(f"   ficheros de texto inspeccionados: {n}")
print()
for rel, ln, why, frag in hits[:30]:
    print(f"     {rel}:{ln}  [{why}]")
    print(f"        ...{frag}...")
if not hits:
    print("     ninguno")
if len(hits) > 30:
    print(f"     ... y {len(hits) - 30} mas")

print()
line()
if hits or fails:
    if hits:
        fails.append(f"{len(hits)} citas de correspondencia")
    print("*** FALLA: " + "; ".join(fails) + " ***")
    print(f"    Lo privado se MUEVE a {SITIO}/, no se reescribe para que pase el control.")
    line()
    sys.exit(1)
print("LIMPIO -- nada de lo que se empujaria cita correspondencia")
line()
