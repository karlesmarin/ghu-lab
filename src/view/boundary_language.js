/* Scoped UI translation. Numeric values, input keys and exported JSON stay unchanged.
 * Text nodes are updated in place, preserving controls, focus and event handlers.
 * Original text is retained weakly so switching back to English restores it exactly. */
const BRX_SPANISH = {
 'Quantization and certificates':'Cuantización y certificados',
 'Spin(20): ta² = −1, but Ua = −i ta has Ua² = +1. The representation matrices alone do not establish an ordinary equivariant Spin(20) bundle.':'Spin(20): ta² = −1, pero Ua = −i ta cumple Ua² = +1. Las matrices de representación por sí solas no establecen un fibrado Spin(20) equivariante ordinario.',
 'Boundary research: spectra, profile rank and anomaly tests':'Investigación de fronteras: espectro, rango de perfiles y anomalías',
 'Test a proposed boundary mechanism in separate steps: its flat fermion gap, profile independence, parity-inserted traces and a restricted six-dimensional tensor condition.':'Comprueba un mecanismo de frontera por partes: brecha fermiónica plana, independencia de perfiles, trazas con paridad y una condición tensorial restringida en seis dimensiones.',
 'Mass landscape view':'Vista de las masas',
 '2D · select / drag a point':'2D · selecciona o arrastra un punto',
 '3D · select a mesh node':'3D · selecciona un nodo de la malla',
 '3D perspective [degrees]':'Perspectiva 3D [grados]',
 'Boundary strength κ²L':'Acoplamiento de frontera κ²L',
 'Imposed Wilson θ [rad]':'Ángulo de Wilson impuesto θ [rad]',
 'Profile example M (unit rectangle)':'Ejemplo de perfiles M (rectángulo unidad)',
 'Identical 6D families (separate test)':'Familias 6D idénticas (prueba separada)',
 '6D lepton chirality':'Quiralidad leptónica 6D',
 'Opposite to Q':'Opuesta a Q',
 'Same as Q':'Igual que Q',
 'Spin(20) parity insertion':'Inserción de paridad en Spin(20)',
 'C1 · six-dimensional corner':'C1 · esquina de seis dimensiones',
 'C0 · six-dimensional corner':'C0 · esquina de seis dimensiones',
 'C0 W · four-dimensional intersection':'C0 W · intersección de cuatro dimensiones',
 'Research baseline':'Referencia de investigación',
 'Uncoupled boundary':'Frontera sin acoplamiento',
 'Massless profile example':'Ejemplo de perfiles sin masa',
 'One 6D family':'Una familia 6D',
 'Three 6D families':'Tres familias 6D',
 'Use this point as comparison':'Usar este punto como comparación',
 'Clear comparison':'Borrar comparación',
 'Restore reference inputs':'Restablecer entradas de referencia',
 'Save research summary':'Guardar resumen de investigación',
 'Save inputs and results (JSON)':'Guardar entradas y resultados (JSON)',
 'Save figure (SVG)':'Guardar gráfica (SVG)',
 'Figure to save':'Gráfica que se guardará',
 'Full guide ↗':'Guía completa ↗',
 'What this tests':'Qué se comprueba',
 'Which specific requirement does a proposed boundary construction meet or fail?':'¿Qué requisito concreto satisface o incumple la construcción de frontera propuesta?',
 'First paired normal kR':'Primer kR normal emparejado',
 'Profile Gram rank':'Rango de Gram de los perfiles',
 '6D doublet residue':'Residuo de dobletes 6D',
 'Reading:':'Interpretación:',
 'These are separate diagnostics. A lifted mode, independent profiles and a passing restricted tensor test do not establish a complete anomaly-free GHU model.':'Son diagnósticos separados. Elevar un modo, obtener perfiles independientes y cumplir la condición tensorial restringida no establece un modelo GHU completo sin anomalías.',
 'Saved reference is a calculation snapshot. Its inputs and results are included in the JSON export.':'La referencia guardada conserva un cálculo. Sus entradas y resultados se incluyen en la exportación JSON.',
 'Saved reference':'Referencia guardada',
 'Reference: ':'Referencia: ',
 '1 · Does the boundary coupling lift the paired normal zero mode?':'1 · ¿El acoplamiento de frontera eleva el modo cero normal emparejado?',
 'First normal root kR = ':'Primera raíz normal kR = ',
 '. At the imposed θ, the periodic branches have mR = ':'. Al θ impuesto, las ramas periódicas tienen mR = ',
 ' (unpaired) and ':' (sin emparejar) y ',
 ' (paired).':' (emparejada).',
 'Selected: κ²L = ':'Punto seleccionado: κ²L = ',
 'Selected preview: κ²L = ':'Vista previa: κ²L = ',
 ' rad, paired mR = ':' rad, mR emparejada = ',
 '. Release to apply':'. Suelta para aplicar',
 ' (nearest mesh node)':' (nodo más cercano de la malla)',
 'On narrow screens, scroll the figure sideways to keep its labels readable. Select or drag a point and release to apply it to the inputs; arrow keys also move the selected point. The 3D view selects the nearest mesh node. The red line fixes the current boundary coupling; the curve below is that same slice. Colour and height represent the same mass, not a potential. The colour scale stays fixed; the coupling range expands above 4 if needed.':'En pantallas estrechas, desplaza la gráfica horizontalmente para leer las etiquetas. Selecciona o arrastra un punto y suelta para aplicar sus valores; también puedes usar las flechas del teclado. La vista 3D selecciona el nodo más cercano de la malla. La línea roja fija el acoplamiento actual; la curva inferior corresponde a ese mismo corte. El color y la altura representan la misma masa, no un potencial. La escala de color es fija; el intervalo de acoplamiento se amplía por encima de 4 cuando hace falta.',
 'Flat boundary spectrum at an imposed Wilson background':'Espectro plano con un fondo de Wilson impuesto',
 'Unpaired branch':'Rama sin emparejar',
 'Paired branch':'Rama emparejada',
 'Imposed θ [rad]':'θ impuesto [rad]',
 'The upper (paired) branch contains the boundary gap. The lower (unpaired) branch contains only the imposed Wilson shift. At zero boundary coupling the two curves coincide.':'La rama superior (emparejada) incluye la brecha de frontera. La inferior (sin emparejar) solo incluye el desplazamiento de Wilson impuesto. Sin acoplamiento de frontera, ambas curvas coinciden.',
 'Normal level j':'Nivel normal j',
 'Root kL':'Raíz kL',
 'Scaled equation residual':'Residuo escalado de la ecuación',
 'kL tan(kL) = κ²L. Flat uniform action, periodic transverse branch, no added boundary kinetic terms. The Wilson background is supplied; the graph does not locate a vacuum.':'kL tan(kL) = κ²L. Acción plana uniforme, rama transversal periódica y sin términos cinéticos de frontera añadidos. El fondo de Wilson es una entrada; la gráfica no determina un vacío.',
 '2 · Are overlapping profiles independent?':'2 · ¿Son independientes los perfiles que se solapan?',
 'Numerical Gram rank: ':'Rango numérico de Gram: ',
 ' of 3':' de 3',
 ', threshold ':', umbral ',
 '. Nonzero overlap alone does not imply dependence. M here belongs to a separate unit-rectangle profile example; it is not a bulk mass added to the Spin(20) action.':'. Un solapamiento no nulo no implica dependencia. Aquí M pertenece a un ejemplo separado de perfiles en un rectángulo unidad; no es una masa añadida a la acción de Spin(20) en el volumen.',
 'A positive bar above the threshold is an independent direction. At M = 0 one eigenvalue is numerically zero. Bar lengths use the displayed linear scale, which adapts to M; compare the printed values between runs.':'Una barra positiva por encima del umbral representa una dirección independiente. Con M = 0, un autovalor es numéricamente cero. La escala lineal indicada se adapta a M; compara los valores escritos entre cálculos.',
 'Gram eigenvalue':'Autovalor de Gram',
 'Value':'Valor',
 '3 · What changes when a parity is inserted in the trace?':'3 · ¿Qué cambia al insertar una paridad en la traza?',
 'Positive half-spin 512 of Spin(20); Cartan probe (':'Semiespinor positivo 512 de Spin(20); sonda de Cartan (',
 '). These scalar evaluations can detect nonzero moments; a zero at one probe is not proof that the full polynomial vanishes.':'). Estas evaluaciones escalares pueden detectar momentos no nulos; un cero en una sonda no demuestra que el polinomio completo se anule.',
 'Degree d':'Grado d',
 'Exact Tr(λ Fᵈ) at the probe':'Tr(λ Fᵈ) exacta en la sonda',
 'A six-dimensional anomaly polynomial uses degree 4 and mixed degree 2; a four-dimensional one uses degree 3 and mixed degree 1. These are unweighted traces. Local projector/cover factors, consistent descent, mirrors and inflow remain pending.':'Un polinomio de anomalía en seis dimensiones usa grado 4 y grado mixto 2; en cuatro dimensiones, grado 3 y grado mixto 1. Son trazas sin ponderar. Quedan pendientes los factores locales de proyección y recubrimiento, el descenso consistente, las contribuciones espejo y el flujo de anomalía.',
 '4 · Do identical 6D families meet the restricted SU(2) tensor condition?':'4 · ¿Cumplen las familias 6D idénticas la condición tensorial restringida de SU(2)?',
 'Passes this restricted condition':'Cumple esta condición restringida',
 'Fails this restricted condition':'No cumple esta condición restringida',
 ': signed complex-doublet excess ':': exceso firmado de dobletes complejos ',
 ', residue modulo 6 = ':', residuo módulo 6 = ',
 '. Half-doublet coefficient = ':'. Coeficiente de semidobletes = ',
 '; its modulus is 12.':'; su módulo es 12.',
 'All families share the same 6D chirality assignments; Q has positive chirality. This is not inferred from three 4D zero modes.':'Todas las familias comparten las mismas asignaciones de quiralidad 6D; Q tiene quiralidad positiva. Esto no se deduce de tres modos cero 4D.',
 'Restricted standalone 6D SU2 tensor condition. No verdict on the complete 8D orbifold, its inflow or its global quotient.':'Condición tensorial restringida de SU(2) para un sistema 6D aislado. No emite un veredicto sobre el orbifold 8D completo, su flujo de anomalía o su cociente global.',
 ' The criterion allows multiples of three under these premises; it does not select exactly three.':' Bajo estas premisas, el criterio permite múltiplos de tres; no selecciona exactamente tres.',
 'Assumptions, provenance and what remains unresolved':'Hipótesis, procedencia y cuestiones pendientes',
 'Separate diagnostics, not a joint GHU fit.':'Diagnósticos separados; no constituyen un ajuste GHU conjunto.',
 'Robin spectrum: flat metric, uniform coupling and orientations, common tangent gauge connection, no extra boundary kinetic terms; L5=L6=pi R and periodic transverse branch.':'Espectro de Robin: métrica plana, acoplamiento y orientaciones uniformes, conexión gauge tangencial común, sin términos cinéticos adicionales de frontera; L5=L6=πR y rama transversal periódica.',
 'Wilson theta is imposed; no potential minimum or experimental mass scale is determined.':'El ángulo de Wilson es impuesto; no se determina un mínimo del potencial ni una escala de masa experimental.',
 'Profile example: unit rectangle and three exponential solutions from a restricted ansatz; no full-domain or compactification claim.':'Ejemplo de perfiles: rectángulo unidad y tres soluciones exponenciales de una forma restringida; no se establece el dominio completo ni una compactificación.',
 'Spin20: positive half-spin weights, integer Cartan probe, product-of-sign insertion; no projector, cover, consistent-descent or inflow coefficients.':'Spin(20): pesos del semiespinor positivo, sonda entera de Cartan e inserción como producto de signos; sin coeficientes de proyección, recubrimiento, descenso consistente ni flujo de anomalía.',
 'Full anomaly cancellation: unknown.':'Cancelación completa de anomalías: desconocida.',
 'Normalized local anomaly distribution and 7D mirror parity anomaly':'Distribución normalizada de anomalías locales y anomalía de paridad espejo 7D',
 'Global group quotients, charge lattice and inflow':'Cocientes globales del grupo, red de cargas y flujo de anomalía',
 'Full tensor/axion spectrum, Higgs vacuum, flavour and neutrino masses':'Espectro completo de tensores y axiones, vacío de Higgs, sabor y masas de neutrinos',
 'Tool ':'Herramienta ',
 '. JSON includes every input, source and scope.':'. El JSON incluye todas las entradas, fuentes e hipótesis.',
 'Sources: ':'Fuentes: ',
 '. The flat boundary spectrum and Spin(20) diagnostics are calculations of the ACTION study, not results attributed to these papers.':'. El espectro plano de frontera y los diagnósticos de Spin(20) son cálculos del estudio ACTION; no son resultados atribuidos a estos artículos.',
 'Numerical details · ':'Detalles numéricos · ',
 '3D paired mass surface':'Superficie 3D de masa emparejada',
 '2D paired mass map':'Mapa 2D de masa emparejada',
 '; use controls or arrow keys to select a point':'; usa los controles o las flechas para seleccionar un punto',
 'Cell mean mR ':'Media de mR en la celda ',
 '; select a mesh node':'; selecciona un nodo de la malla',
 'Colour = paired mass mR · fixed linear scale':'Color = masa emparejada mR · escala lineal fija',
 'Gram eigenvalues and numerical rank':'Autovalores de Gram y rango numérico',
 ' independent directions among 3 profiles':' direcciones independientes entre 3 perfiles',
 'Eigenvalue · linear scale':'Autovalor · escala lineal',
 'Unnormalized unit-rectangle profiles':'Perfiles sin normalizar en un rectángulo unidad',
 'Last valid results retained.':'Se conservan los últimos resultados válidos.',
 'No result is valid for the current combined inputs.':'No hay resultados válidos para la combinación actual de entradas.',
 'profile mass M':'masa M del perfil',
 'identical 6D families':'familias 6D idénticas',
 'Wilson theta':'ángulo de Wilson',
 '3D viewing angle':'ángulo de perspectiva 3D',
 'expected integer in':'se requiere un entero en',
 'expected in':'se requiere un valor en',
 'Choose 2D or 3D':'Elige 2D o 3D',
 'Unknown Spin20 insertion':'Inserción de Spin(20) desconocida',
 'Lepton chirality must be +1 or -1':'La quiralidad leptónica debe ser +1 o −1',
 'External calculation: not attached.':'Cálculo externo: no adjunto.',
 'Comparison snapshot included in the full JSON export.':'La comparación se incluye en la exportación JSON completa.',
 'No comparison snapshot saved.':'No hay una comparación guardada.'
};
Object.assign(BRX_SPANISH,GMR_SPANISH,NCX_SPANISH);
const BRX_TRANSLATIONS = Object.entries(BRX_SPANISH).sort((a,b)=>b[0].length-a[0].length);
const BRX_ORIGINAL_TEXT = new WeakMap(), BRX_ORIGINAL_ATTRS = new WeakMap();
function brxTranslate(text,language=GUIDE_LANGUAGE){
 if(language!=='es')return text;
 for(const [en,es] of BRX_TRANSLATIONS)text=text.split(en).join(es);
 return text;
}
function brxLocalize(card=document.getElementById('rx_boundaryresearch')){
 if(!card)return;
 card.lang=GUIDE_LANGUAGE;
 const update=(original,current)=>original&&current===original.translated?original.original:current;
 const walk=document.createTreeWalker(card,NodeFilter.SHOW_TEXT);
 while(walk.nextNode()){
  const node=walk.currentNode;if(node.parentElement?.closest('metadata,script,style'))continue;
  const original=update(BRX_ORIGINAL_TEXT.get(node),node.nodeValue),translated=brxTranslate(original);
  BRX_ORIGINAL_TEXT.set(node,{original,translated});if(node.nodeValue!==translated)node.nodeValue=translated;
 }
 for(const element of card.querySelectorAll('[aria-label],[title]')){
  const record=BRX_ORIGINAL_ATTRS.get(element)||{};
  for(const attr of ['aria-label','title'])if(element.hasAttribute(attr)){
   const original=update(record[attr],element.getAttribute(attr)),translated=brxTranslate(original);
   record[attr]={original,translated};element.setAttribute(attr,translated);
  }
  BRX_ORIGINAL_ATTRS.set(element,record);
 }
}
