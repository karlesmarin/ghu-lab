"""Maintain the bilingual boundary-research guide. Run from any directory."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
META = dict(id='boundaryresearch', kind='experiment', host='anomalies',
    route='s=anomalies&help=boundaryresearch', video='boundaryresearch',
    source='src/modules/boundary_research.mjs', terms=[], related=['anomalies','rsanomaly'],
    references=[
        dict(label='Fujimoto et al.: rectangle boundary conditions and profiles, sections 2–5',url='https://arxiv.org/abs/1609.01413'),
        dict(label='Asaka, Buchmüller, Covi: localized orbifold anomalies, sections 2–4',url='https://arxiv.org/abs/hep-ph/0209144'),
        dict(label='Dobrescu, Poppitz: identical six-dimensional generations',url='https://arxiv.org/abs/hep-ph/0102010'),
        dict(label='Lee, Tachikawa: six-dimensional global anomalies and tensor quantization, sections 2–3',url='https://arxiv.org/abs/2012.11622')])
EN = dict(
 title='Boundary research: spectrum, independent profiles and anomaly diagnostics',
 what='Four separate tests help investigate a proposed GHU boundary mechanism: roots of a flat fermion boundary problem, the numerical rank of overlapping profiles, exact parity-inserted spinor traces and a restricted six-dimensional SU(2) tensor condition.',
 purpose='Use these tools to find which requirement fails and why before attempting a full model. A mass gap addresses unwanted paired modes; Gram rank tests linear independence; inserted traces expose localized anomaly terms; the tensor condition tests a restricted quantization requirement. Passing all four does not prove a viable Standard Model embedding or a complete quantum theory.',
 steps=['Open Anomalies and find Boundary research. Press Research baseline to restore all inputs; Demo runs the worked examples and ends with this guide.',
 'Set Boundary strength to 0, then 1. Compare the first normal root and the paired curve at the same imposed Wilson angle.',
 'Set Profile example M to 0, then 1. Compare the Gram eigenvalues and numerical rank.',
 'Switch the parity insertion between C1, C0 and C0 W. Read the exact trace table, keeping its degree and support dimension in mind.',
 'With lepton chirality Opposite to Q, compare one and three identical 6D families. Read the signed doublet excess and its residue.',
 'Expand assumptions and provenance. Pin a comparison, export the card JSON and save the application link to repeat the calculation.'],
 read='Read each result with its own assumptions. The normal gap is dimensionless kR; a Gram rank is numerical and threshold-dependent; the traces are exact scalar evaluations without local weights; a zero residue passes only the stated standalone six-dimensional condition. Full anomaly cancellation stays unknown.',
 controls=[
 dict(name='Boundary strength κ²L',meaning='Nonnegative dimensionless coupling a of the uniform flat boundary action, from 0 to 100. L = πR.',try_text='Use 0 and 1; the first kR changes from 0 to approximately 0.273853.'),
 dict(name='Imposed Wilson θ [rad]',meaning='Supplied angle from 0 to π for the periodic transverse branch; this is not a computed vacuum.',try_text='At a = 1 compare θ = 0 and θ = 0.2; the unpaired mass changes while the normal root stays fixed.'),
 dict(name='Profile example M',meaning='Mass parameter from 0 to 2 on a separate unit rectangle. It is not a bulk mass inserted in the Spin(20) action.',try_text='Compare M = 0 and M = 1: rank 2 becomes rank 3.'),
 dict(name='Spin(20) parity insertion',meaning='C1, C0 or C0 W sign insertion on the positive half-spin representation of dimension 512. The Cartan probe is fixed and displayed.',try_text='Compare C1 and C0 W. Six-dimensional anomalies use degrees 4 and 2; four-dimensional ones use degrees 3 and 1.'),
 dict(name='Identical 6D families',meaning='Integer from 0 to 12 in a separate family-count example, assuming identical 6D chirality assignments.',try_text='One family fails; three pass this restricted condition. Six also pass: it does not select exactly three.'),
 dict(name='6D lepton chirality',meaning='Same as Q or opposite to Q, with quark chirality fixed positive and three colours.',try_text='Switch the sign and compare the signed doublet excess; retain the identical-family assumption.')],
 outputs=[
 dict(name='Root table and mass curves',meaning='Six roots of x tan(x) = a, with x = kL, and scaled residuals. Curves show the lightest paired and unpaired branches versus the imposed angle; they are not the full Kaluza–Klein spectrum.'),
 dict(name='Gram eigenvalues and rank',meaning='Eigenvalues of the complex Hermitian Gram matrix for profile angles 0, π/2 and π. Rank counts eigenvalues above the displayed numerical threshold; overlap alone does not establish dependence.'),
 dict(name='Exact inserted moments',meaning='Tr(λ Fᵈ) for degrees 0 through 4 at one integer Cartan probe, evaluated with exact rational arithmetic. A nonzero value disproves an identically vanishing polynomial; a zero at one probe does not prove it.'),
 dict(name='Doublet excess and residues',meaning='The signed complex-doublet excess must be a multiple of 6 in the stated standalone 6D test. Twice that coefficient counts half-doublets and must be a multiple of 12.'),
 dict(name='JSON, comparison and saved link',meaning='JSON records tool version, schema, all parameters, roots, Gram results, exact moments, assumptions, sources and unresolved requirements. A pinned comparison overlays the earlier paired curve; a saved link restores controls.')],
 example=dict(title='Find three different reasons a construction can fail',steps=[
 'Load Research baseline, then Uncoupled boundary: the first normal root is zero.',
 'Restore boundary strength 1: the first kR is approximately 0.273853.',
 'Load Massless profile example: the three chosen profiles span only two independent directions.',
 'Restore M = 1: the eigenvalues are approximately 0.172999, 2.783424 and 10.686355, and the numerical rank is three.',
 'Select One 6D family with Opposite to Q: excess 2 gives residue 2. Select Three 6D families: excess 6 gives residue 0.',
 'Switch C1 to C0 W and inspect the trace table, then export JSON.'],expect='The boundary gap, profile independence and restricted family condition respond to different changes. None of them settles localized or global anomaly cancellation of the full construction.'),
 limits=['The flat spectrum assumes uniform coupling, no additional boundary kinetic terms and the periodic transverse branch. It does not determine a Wilson vacuum, realistic flavour or neutrino masses.',
 'The profile calculation is a separate mathematical example, not a derivation of three physical families. Numerical rank depends on tolerance; exact zero modes need an analytic boundary-domain analysis.',
 'Inserted traces omit projector and covering-space normalization, consistent descent, mirror contributions and inflow. The scalar probe is not the full anomaly polynomial.',
 'The SU(2) criterion applies to a specified standalone six-dimensional tensor setting. It cannot be transferred automatically to an eight-dimensional orbifold corner coupled to bulk inflow.',
 'Local coefficients, integral tensor charge lattice, global gauge group, new boson zero modes and full quantum consistency remain unresolved.'],
 troubleshooting=[dict(symptom='The first normal root is zero.',action='Check boundary strength. At zero coupling this is the expected zero mode; it is not a numerical solver failure.'),
 dict(symptom='Overlapping profiles still have rank three.',action='Overlap measures nonorthogonality. Dependence requires a null Gram direction; inspect the eigenvalues and threshold.'),
 dict(symptom='An inserted moment is zero.',action='Check its degree and insertion. Evaluate the polynomial or more probes before claiming cancellation; this interface shows only one fixed probe.'),
 dict(symptom='Three families pass but full cancellation is unknown.',action='That is intentional: the modular condition is necessary in its stated setting, not a complete local/global anomaly calculation.'),
 dict(symptom='An invalid input leaves the old result visible.',action='The controls report the error and keep the last valid calculation. Restore the allowed range or press Research baseline.')])
ES = dict(
 title='Investigación de fronteras: espectro, perfiles independientes y anomalías',
 what='Cuatro pruebas separadas permiten investigar un mecanismo de frontera en GHU: raíces de un problema fermiónico plano, rango numérico de perfiles solapados, trazas espinoriales exactas con inserciones de paridad y una condición restringida para tensores SU(2) en seis dimensiones.',
 purpose='Sirven para identificar qué requisito falla y por qué antes de construir el modelo completo. La brecha de masa aborda los modos emparejados no deseados; el rango de Gram comprueba independencia; las trazas con inserciones detectan términos de anomalía localizada; la condición tensorial comprueba un requisito restringido de cuantización. Superar las cuatro no demuestra un encaje viable del Modelo Estándar ni una teoría cuántica completa.',
 steps=['Abre Anomalies y busca Boundary research. Pulsa Research baseline para restablecer todas las entradas; Demo recorre los ejemplos y termina con esta guía.',
 'Pon Boundary strength en 0 y después en 1. Compara la primera raíz normal y la curva emparejada al mismo ángulo de Wilson impuesto.',
 'Pon Profile example M en 0 y después en 1. Compara los autovalores de Gram y el rango numérico.',
 'Cambia la inserción de paridad entre C1, C0 y C0 W. Lee la tabla de trazas exactas atendiendo al grado y a la dimensión del soporte.',
 'Con quiralidad leptónica Opposite to Q, compara una y tres familias idénticas de seis dimensiones. Lee el exceso firmado de dobletes y su residuo.',
 'Despliega las hipótesis y la procedencia. Fija una comparación, exporta el JSON de la tarjeta y guarda el enlace de la aplicación para repetir el cálculo.'],
 read='Lee cada resultado con sus propias hipótesis. La brecha normal es kR, sin dimensiones; el rango de Gram es numérico y depende del umbral; las trazas son evaluaciones escalares exactas sin pesos locales; un residuo nulo solo satisface la condición indicada para el sistema aislado de seis dimensiones. La cancelación completa de anomalías sigue pendiente.',
 controls=[
 dict(name='Boundary strength κ²L',meaning='Acoplamiento adimensional no negativo a de la acción plana uniforme de frontera, entre 0 y 100. L = πR.',try_text='Usa 0 y 1; el primer kR pasa de 0 a aproximadamente 0.273853.'),
 dict(name='Imposed Wilson θ [rad]',meaning='Ángulo impuesto entre 0 y π para la rama transversal periódica; no es un vacío calculado.',try_text='Con a = 1 compara θ = 0 y θ = 0.2; cambia la masa no emparejada, pero la raíz normal permanece fija.'),
 dict(name='Profile example M',meaning='Parámetro de masa entre 0 y 2 en un rectángulo unidad separado. No es una masa de bulk añadida a la acción Spin(20).',try_text='Compara M = 0 y M = 1: el rango pasa de 2 a 3.'),
 dict(name='Spin(20) parity insertion',meaning='Inserción de signos C1, C0 o C0 W en la representación semiespinorial positiva de dimensión 512. La sonda de Cartan es fija y aparece en pantalla.',try_text='Compara C1 y C0 W. Las anomalías de seis dimensiones usan grados 4 y 2; las de cuatro dimensiones, grados 3 y 1.'),
 dict(name='Identical 6D families',meaning='Entero entre 0 y 12 en un ejemplo separado de conteo de familias, suponiendo asignaciones idénticas de quiralidad en seis dimensiones.',try_text='Una familia falla; tres cumplen esta condición restringida. Seis también cumplen: no selecciona exactamente tres.'),
 dict(name='6D lepton chirality',meaning='Same as Q u Opposite to Q, fijando positiva la quiralidad de los quarks y contando tres colores.',try_text='Cambia el signo y compara el exceso firmado de dobletes; mantén la hipótesis de familias idénticas.')],
 outputs=[
 dict(name='Tabla de raíces y curvas de masa',meaning='Seis raíces de x tan(x) = a, con x = kL, y residuos escalados. Las curvas muestran las ramas emparejada y no emparejada más ligeras frente al ángulo impuesto; no son todo el espectro de Kaluza–Klein.'),
 dict(name='Autovalores y rango de Gram',meaning='Autovalores de la matriz de Gram hermítica compleja para ángulos de perfil 0, π/2 y π. El rango cuenta los autovalores mayores que el umbral numérico mostrado; el solapamiento no basta para afirmar dependencia.'),
 dict(name='Momentos exactos con inserción',meaning='Tr(λ Fᵈ) para grados de 0 a 4 en una sonda entera de Cartan, con aritmética racional exacta. Un valor no nulo refuta que el polinomio sea idénticamente cero; un cero en una sonda no lo demuestra.'),
 dict(name='Exceso de dobletes y residuos',meaning='El exceso firmado de dobletes complejos debe ser múltiplo de 6 en la prueba indicada para el sistema aislado de seis dimensiones. El doble de ese coeficiente cuenta semidobletes y debe ser múltiplo de 12.'),
 dict(name='JSON, comparación y enlace guardado',meaning='El JSON recoge versión, esquema, parámetros, raíces, resultados de Gram, momentos exactos, hipótesis, fuentes y requisitos pendientes. Una comparación fijada superpone la curva emparejada anterior; el enlace guardado restaura los controles.')],
 example=dict(title='Identificar tres motivos distintos de fallo',steps=[
 'Carga Research baseline y después Uncoupled boundary: la primera raíz normal es cero.',
 'Restablece el acoplamiento de frontera en 1: el primer kR vale aproximadamente 0.273853.',
 'Carga Massless profile example: los tres perfiles elegidos solo abarcan dos direcciones independientes.',
 'Restablece M = 1: los autovalores valen aproximadamente 0.172999, 2.783424 y 10.686355, y el rango numérico es tres.',
 'Selecciona One 6D family con Opposite to Q: exceso 2 y residuo 2. Selecciona Three 6D families: exceso 6 y residuo 0.',
 'Cambia C1 a C0 W, examina la tabla de trazas y exporta el JSON.'],expect='La brecha de frontera, la independencia de perfiles y la condición restringida de familias responden a cambios distintos. Ninguna resuelve la cancelación localizada o global de anomalías de la construcción completa.'),
 limits=['El espectro plano supone acoplamiento uniforme, ausencia de términos cinéticos adicionales de frontera y rama transversal periódica. No determina un vacío de Wilson, sabor realista ni masas de neutrinos.',
 'El cálculo de perfiles es un ejemplo matemático separado, no una deducción de tres familias físicas. El rango numérico depende de la tolerancia; los modos cero exactos necesitan analizar el dominio de frontera.',
 'Las trazas omiten la normalización de proyectores y del espacio de recubrimiento, el descenso consistente, las contribuciones espejo y el flujo de anomalía. La sonda escalar no es el polinomio completo.',
 'El criterio SU(2) corresponde a un sistema tensorial aislado específico de seis dimensiones. No puede trasladarse automáticamente a una esquina de orbifold de ocho dimensiones acoplada al flujo del bulk.',
 'Siguen pendientes los coeficientes locales, la red integral de cargas tensoriales, el grupo gauge global, los nuevos modos cero bosónicos y la consistencia cuántica completa.'],
 troubleshooting=[dict(symptom='La primera raíz normal es cero.',action='Comprueba el acoplamiento de frontera. Si es nulo, ese modo cero es el resultado esperado, no un fallo del método numérico.'),
 dict(symptom='Los perfiles se solapan, pero el rango es tres.',action='Solaparse significa no ser ortogonales. La dependencia exige una dirección nula de Gram; examina autovalores y umbral.'),
 dict(symptom='Un momento con inserción es cero.',action='Comprueba el grado y la inserción. Evalúa el polinomio o más sondas antes de afirmar cancelación; esta interfaz solo muestra una sonda fija.'),
 dict(symptom='Tres familias cumplen, pero la cancelación completa sigue pendiente.',action='Es intencionado: la condición modular es necesaria en su contexto, pero no calcula todas las anomalías locales y globales.'),
 dict(symptom='Una entrada inválida conserva el resultado anterior.',action='Los controles muestran el error y mantienen el último cálculo válido. Restablece el intervalo permitido o pulsa Research baseline.')])
EN['controls'] += [dict(name='Mass landscape view / 3D perspective',meaning='The 2D map and 3D surface use the same sampled paired masses and fixed colour range. Perspective is a display angle, not a physical parameter.',try_text='Drag on the 2D map and release to apply the values. In 3D click a mesh node; adjust perspective between 15 and 75 degrees. Arrow keys move the selected point.') ]
ES['controls'] += [dict(name='Mass landscape view / 3D perspective',meaning='El mapa 2D y la superficie 3D usan las mismas masas emparejadas y escala de color fija. La perspectiva es un ángulo de visualización, no un parámetro físico.',try_text='Arrastra en el mapa 2D y suelta para aplicar los valores. En 3D pulsa un nodo de la malla; ajusta la perspectiva entre 15 y 75 grados. Las flechas del teclado mueven el punto seleccionado.') ]
EN['outputs'] += [dict(name='2D map, 3D surface and Gram bars',meaning='Mass colour is linear from 0 to 0.7071 in mR. The red slice fixes the current coupling; the white point is the selected calculation. Surface cells visualize sampled data, while the selected value is recomputed. Gram bars have their own labelled adaptive linear scale and numerical eigenvalues.') ]
ES['outputs'] += [dict(name='Mapa 2D, superficie 3D y barras de Gram',meaning='El color de masa es lineal entre 0 y 0.7071 en mR. El corte rojo fija el acoplamiento actual; el punto blanco marca el cálculo seleccionado. Las celdas visualizan datos muestreados y el valor seleccionado se recalcula. Las barras de Gram tienen su propia escala lineal adaptable, etiquetada, y autovalores numéricos.') ]
for body in [EN,ES]:
    for control in body['controls']:control['try']=control.pop('try_text')
# The Spanish card now translates its controls and results, so its instructions
# must use those same labels. Technical identifiers and formulas stay unchanged.
spanish_labels={
 'Research baseline':'Referencia de investigación','Uncoupled boundary':'Frontera sin acoplamiento',
 'Massless profile example':'Ejemplo de perfiles sin masa','One 6D family':'Una familia 6D',
 'Three 6D families':'Tres familias 6D','Opposite to Q':'Opuesta a Q','Same as Q':'Igual que Q',
 'Boundary strength':'Acoplamiento de frontera','Imposed Wilson':'Ángulo de Wilson impuesto',
 'Profile example M':'Ejemplo de perfiles M','Spin(20) parity insertion':'Inserción de paridad en Spin(20)',
 'Identical 6D families':'Familias 6D idénticas','6D lepton chirality':'Quiralidad leptónica 6D',
 'Mass landscape view':'Vista de las masas','3D perspective':'Perspectiva 3D',
 'Boundary research':'Investigación de fronteras'
}
def local_labels(value):
    if isinstance(value,str):
        for en,es in sorted(spanish_labels.items(),key=lambda pair:-len(pair[0])):value=value.replace(en,es)
    elif isinstance(value,list):value=[local_labels(x) for x in value]
    elif isinstance(value,dict):value={key:local_labels(x) for key,x in value.items()}
    return value
ES=local_labels(ES)
ES['steps'][0]='Abre Anomalies & proton y busca Investigación de fronteras. Elige Español en la tarjeta. Pulsa Referencia de investigación para restablecer todas las entradas; Demo recorre los ejemplos y termina con esta guía.'
EN['steps'][0]='Open Anomalies & proton and find Boundary research. Select English in the card. Press Research baseline to restore all inputs; Demo runs the worked examples and ends with this guide.'
for name,body in [('docs/user-guides.json',EN),('docs/user-guides.es.json',ES)]:
    p=ROOT/name; text=p.read_text(encoding='utf-8'); data=json.loads(text)
    indent=next((i for i in (1,2,None) if json.dumps(data,ensure_ascii=False,indent=i).rstrip()==text.rstrip()),'bad')
    if indent=='bad':raise ValueError('Unrecognized formatting: '+name)
    data['guides']=[g for g in data['guides'] if g['id']!='boundaryresearch']+[{**META,**body}]
    p.write_bytes((json.dumps(data,ensure_ascii=False,indent=indent)+ ('\n' if text.endswith('\n') else '')).encode('utf-8'))
    print(name,len(data['guides']),'guides')
