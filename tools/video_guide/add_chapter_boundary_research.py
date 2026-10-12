"""Add the boundary tools to the general bilingual video; preserve earlier revisions."""
import json
from pathlib import Path
p=Path(__file__).with_name('storyboard.json');raw=p.read_text(encoding='utf-8');plan=json.loads(raw)
def setting(key,value):return dict(kind='set',selector=f'#rx_boundaryresearch_controls [data-rx="{key}"]',value=value)
def scene(en,es,actions,focus):return dict(text=en,textES=es,actions=actions,focus=dict(selector=focus,index=0),title=None)
steps=[
 scene('The boundary research card separates four questions: a fermion mass gap, independent profiles, parity-inserted traces and a restricted six-dimensional tensor condition. Load the research baseline. These are diagnostic tools, not a completed particle model.',
 'La tarjeta de investigación de fronteras separa cuatro preguntas: una brecha de masa fermiónica, perfiles independientes, trazas con inserciones de paridad y una condición tensorial restringida de seis dimensiones. Carga la referencia de investigación. Son herramientas de diagnóstico, no un modelo de partículas completo.',
 [dict(kind='button',text='Research baseline')],'#rx_boundaryresearch_controls'),
 scene('The two-dimensional map shows the lightest paired mass. The horizontal axis is boundary coupling and the vertical axis is the imposed Wilson angle. Darker means larger mass, on the fixed colour scale. The white point is the selected calculation and the red line fixes the coupling for the curve below. Select or drag a point, then release to update the input values.',
 'El mapa bidimensional muestra la masa emparejada más ligera. El eje horizontal es el acoplamiento de frontera y el vertical, el ángulo de Wilson impuesto. Más oscuro significa mayor masa, en la escala de color fija. El punto blanco marca el cálculo y la línea roja fija el acoplamiento de la curva inferior. Selecciona o arrastra un punto y suelta para actualizar los valores.',
 [setting('strength',2),setting('theta',1)],'#brx_landscape'),
 scene('Switch to the three-dimensional surface. Height and colour encode exactly the same mass data as the map. Change the viewing angle to see the surface clearly; that angle changes the camera, not the physics. Selecting the surface uses the nearest sampled node. The map remains available for precise selection.',
 'Cambia a la superficie tridimensional. La altura y el color representan exactamente los mismos datos de masa que el mapa. Cambia el ángulo de vista para apreciar la superficie; ese ángulo cambia la cámara, no la física. Al seleccionar la superficie se usa el nodo muestreado más cercano. El mapa sigue disponible para seleccionar con precisión.',
 [setting('viewMode',1),setting('viewAngle',65)],'#brx_landscape'),
 scene('Return to the map and set the boundary coupling to zero. The first normal root vanishes, and the paired and unpaired curves coincide. Restoring coupling one opens a normal gap of about zero point two seven four in units of inverse radius. The Wilson angle is supplied here; this calculation does not find the vacuum.',
 'Vuelve al mapa y anula el acoplamiento de frontera. La primera raíz normal se anula y las curvas emparejada y no emparejada coinciden. Al restablecer el acoplamiento en uno aparece una brecha normal de aproximadamente cero coma dos siete cuatro en unidades del inverso del radio. Aquí imponemos el ángulo de Wilson; este cálculo no encuentra el vacío.',
 [setting('viewMode',0),setting('strength',0),setting('strength',1)],'#rx_boundaryresearch_result svg:nth-of-type(1)'),
 scene('Set the separate profile example to zero mass. One Gram eigenvalue becomes numerically zero, so these three profiles span only two independent directions. The bars use a linear scale and the printed values show their size. A numerical threshold is displayed above them.',
 'Pon a cero la masa del ejemplo separado de perfiles. Un autovalor de Gram se hace numéricamente nulo: estos tres perfiles solo abarcan dos direcciones independientes. Las barras usan una escala lineal y los valores escritos indican su tamaño. Encima aparece el umbral numérico.',
 [setting('profileMass',0)],'#brx_gram'),
 scene('Restore profile mass one. All three eigenvalues are positive, despite nonzero overlaps. Overlap means the profiles are not orthogonal; dependence would require a null direction. This example tests linear independence, not the origin of three physical families.',
 'Restablece la masa de perfiles en uno. Los tres autovalores son positivos, aunque existen solapamientos. Solaparse significa que los perfiles no son ortogonales; la dependencia exigiría una dirección nula. Este ejemplo comprueba independencia lineal, no el origen de tres familias físicas.',
 [setting('profileMass',1)],'#brx_gram'),
 scene('Switch from the six-dimensional corner insertion to the four-dimensional intersection insertion. The exact trace table changes. A nonzero evaluation detects a nonzero polynomial, but a zero at one probe cannot establish cancellation. Local normalization, mirror contributions and anomaly inflow are still required.',
 'Cambia de la inserción de esquina de seis dimensiones a la de intersección de cuatro dimensiones. La tabla de trazas exactas cambia. Una evaluación no nula detecta un polinomio no nulo, pero un cero en una sonda no establece cancelación. Siguen haciendo falta normalización local, contribuciones espejo y flujo de anomalía.',
 [setting('insertion',991),dict(kind='click',selector='#rx_boundaryresearch_result details summary',index=2)],'#brx_trace'),
 scene('One identical six-dimensional family with opposite lepton chirality fails the restricted doublet condition. Three families pass. The condition allows multiples of three; it does not select exactly three, and it is not the full anomaly test of the higher-dimensional orbifold.',
 'Una familia de seis dimensiones con quiralidad leptónica opuesta falla la condición restringida de dobletes. Tres familias la cumplen. La condición permite múltiplos de tres: no selecciona exactamente tres y no es la prueba completa de anomalías del orbifold de dimensión superior.',
 [setting('generations',1),setting('generations',3)],'#brx_family'),
 scene('Keep the assumptions with the result. Save the card data to preserve every input, the sampled mass grid, exact moments, sources and unresolved requirements. The guide explains the equations, examples, controls and failure cases. The overall quantum consistency remains an open research question.',
 'Conserva las hipótesis junto al resultado. Guarda los datos de la tarjeta para conservar todas las entradas, la malla de masas, los momentos exactos, las fuentes y los requisitos pendientes. La guía explica ecuaciones, ejemplos, controles y casos de fallo. La consistencia cuántica global sigue siendo una pregunta abierta de investigación.',
 [dict(kind='click',selector='#rx_boundaryresearch_json')],'#rx_boundaryresearch_json')]
plan['chapters']=[ch for ch in plan['chapters'] if ch['id']!='boundaryresearch']
at=next(i for i,ch in enumerate(plan['chapters']) if ch['id']=='exports')
number=at+1
for i,s in enumerate(steps):s['id']=f'{number:02d}_boundaryresearch_{i+1:02d}'
plan['chapters'].insert(at,dict(id='boundaryresearch',title='Boundary research: linked 2D / 3D diagnostics',titleES='Fronteras: diagnósticos enlazados en 2D / 3D',host='anomalies',setup=[],steps=steps,number=number))
for i,ch in enumerate(plan['chapters']):ch['number']=i+1
plan.update(date='2026-10-12',revision='2026-10-12-boundary-research',revisionOf='2026-10-10-demos')
scope_note=' Includes boundary research: linked 2D/3D mass views, Gram rank, inserted traces and a scoped 6D tensor condition.'
plan['scope']=plan['scope'].replace('nine research cards','ten research cards').replace(scope_note,'')+scope_note
intro=plan['chapters'][0]['steps'][0]
if 'boundary research' not in intro['text']:
 intro['text']+=' The boundary research chapter now adds linked two and three-dimensional mass views, independent profiles and scoped anomaly diagnostics.'
 intro['textES']+=' El capítulo de fronteras incorpora vistas de masa enlazadas en dos y tres dimensiones, perfiles independientes y diagnósticos de anomalías con su alcance indicado.'
p.write_bytes((json.dumps(plan,ensure_ascii=False,indent=2)+'\n').encode('utf-8'))
print(plan['revision'],len(plan['chapters']),'chapters',sum(len(ch['steps']) for ch in plan['chapters']),'scenes')
