/* card_demos_sections.js — hand-written 🎬 demos of menu sections (run by card_demo.js; they replace the generic
 * storyboard demo of the same id).
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * A section has no single result object, so these banners quote what the section itself prints at that moment
 * («…», via cdmT/cdmS) beside a short frame of ours. A number in a banner is therefore always a number on the page,
 * and no banner claims what the page does not say.  Scripts only; build/demos.mjs runs them in a browser.
 */
const cdmQ = (sel, n = 1) => cdmEsc(cdmS(sel, n));
const cdmQT = sel => cdmEsc(cdmT(sel));
const cdmNone = () => null;
/* the Higgs-mass row of the certified benchmark table: approximation and full-Fourier enclosures, as printed */
function cdmHiggsRow(lang) {
  const row = cdmFind('#mdResults > div:first-child', /^Higgs mass/), b = row.match(/\[[^\]]+\]/g) || [];
  if (b.length < 2) return cdmEsc(row);
  return lang === 'es' ? `masa del Higgs ${b[0]} GeV (aproximación) frente a ${b[1]} GeV (Fourier completo)` : `Higgs mass ${b[0]} GeV (approximation) against ${b[1]} GeV (full Fourier)`;
}

Object.assign(CDM_DEMOS, {
  hierarchy: {
    model: cdmNone,
    steps: [
      { en: () => `Hierarchy: where the SU(7) model puts the compactification scale and the Higgs mass. The section says: «${cdmQ('#lead')}»`,
        es: () => `Hierarchy: dónde pone el modelo SU(7) la escala de compactificación y la masa del Higgs. La sección dice: «${cdmQ('#lead')}»`,
        hl: '#lead' },
      { en: () => `Two Higgs masses, on purpose: ${cdmQT('#sM')} GeV at the small-phase stationary point, and ${cdmQT('#sMSum')} from the summed potential (${cdmQT('#sMSums')}). 1/R = ${cdmQT('#sR')}. The ceiling belongs to the small-angle approximation.`,
        es: () => `Dos masas del Higgs, a propósito: ${cdmQT('#sM')} GeV en el punto estacionario de fase pequeña, y ${cdmQT('#sMSum')} con el potencial sumado (${cdmQT('#sMSums')}). 1/R = ${cdmQT('#sR')}. El techo pertenece a la aproximación de ángulo pequeño.`,
        hl: '#sM' },
      { en: () => `The verdict, as the section states it: «${cdmQ('#vd')}»`, es: () => `El veredicto, tal como lo da la sección: «${cdmQ('#vd')}»`, hl: '#vd' },
      { en: () => 'Change the diagnostic gauge coupling g₄ to 0.7…', es: () => 'Cambia el acoplo gauge de diagnóstico g₄ a 0,7…',
        set: ['#hrG4', 0.7],
        then: { en: () => 'Three response plots: g₄ is a choice of model (it moves m_h, 1/R stays fixed), the measured W mass is propagated, and the winding cutoff shows convergence. Read the axes with the central values.',
                es: () => 'Tres gráficas de respuesta: g₄ es una elección de modelo (mueve m_h y 1/R queda fija), la masa del W medida se propaga, y el corte de devanados muestra la convergencia. Lee los ejes con los valores centrales.', hl: '#hrPlot_g4' } },
      { en: () => 'Load the first certified benchmark…', es: () => 'Carga el primer punto de referencia certificado…',
        set: ['#mdBenchmark', '0'],
        then: { en: () => `Two enclosed stationary points, the quartic-logarithmic approximation and the full Fourier minimum: ${cdmHiggsRow('en')}. Phase and 1/R₅ have their own absolute and relative error intervals.`,
                es: () => `Dos puntos estacionarios encerrados, la aproximación cuártico-logarítmica y el mínimo de Fourier completo: ${cdmHiggsRow('es')}. La fase y 1/R₅ tienen sus propios intervalos de error absoluto y relativo.`, hl: '#mdResults > div:first-child' } },
      { en: () => `What limits the precision, effect by effect: «${cdmEsc(cdmFind('#cvBudget', /^Moment approximation/))}» and «${cdmEsc(cdmFind('#cvBudget', /^Physical theory/))}» — there is no combined physical error bar.`,
        es: () => `Qué limita la precisión, efecto a efecto: «${cdmEsc(cdmFind('#cvBudget', /^Moment approximation/))}» y «${cdmEsc(cdmFind('#cvBudget', /^Physical theory/))}»: no hay barra de error física combinada.`,
        hl: '#cvBudget' },
    ],
    explain: {
      en: { title: '📊 How to read Hierarchy', lines: ['<b>1/R and m_h</b> come from the vacuum of the chosen bulk content; the small-phase mass and the summed-potential mass are different calculations, and the window is decided by the summed one.', '<b>The ceiling</b> belongs to the small-angle moment approximation; the certified benchmarks enclose the approximation and the full Fourier minimum separately.', '<b>g₄</b> is a model convention, the W mass a measured input, the winding cutoff a numerical control — the three plots keep them apart.', '👉 <b>Now try it:</b> change the multiplicities of the bulk content and watch the verdict.'] },
      es: { title: '📊 Cómo leer Hierarchy', lines: ['<b>1/R y m_h</b> salen del vacío del contenido de bulk elegido; la masa de fase pequeña y la del potencial sumado son cálculos distintos, y la ventana la decide la sumada.', '<b>El techo</b> pertenece a la aproximación de momentos de ángulo pequeño; los puntos certificados encierran por separado la aproximación y el mínimo de Fourier completo.', '<b>g₄</b> es una convención de modelo, la masa del W un dato medido y el corte de devanados un control numérico: las tres gráficas los mantienen separados.', '👉 <b>Pruébalo:</b> cambia las multiplicidades del contenido de bulk y mira el veredicto.'] },
    },
  },

  samepot: {
    model: cdmNone,
    steps: [
      { en: () => `Same potential?: are two bulk contents the same one-loop potential? (Part VII, Theorem 3.) «${cdmQ('#spLead')}»`,
        es: () => `¿Mismo potencial?: ¿son dos contenidos de bulk el mismo potencial a un lazo? (Parte VII, teorema 3.) «${cdmQ('#spLead')}»`,
        hl: '#spLead' },
      { en: () => `«${cdmQ('#spVerdict')}» Five integer coordinates decide it — an if-and-only-if.`, es: () => `«${cdmQ('#spVerdict')}» Lo deciden cinco coordenadas enteras: un si y solo si.`, hl: '#spVerdict' },
      { en: () => 'Copy content A into B…', es: () => 'Copia el contenido A en B…', click: '#spCopy' },
      { en: () => '…and replace B by the canonical representative of A: a different list of matter', es: () => '…y sustituye B por el representante canónico de A: otra lista de materia', click: '#spCanon',
        then: { en: () => `«${cdmQ('#spPlotNote')}» Different matter, identical potential.`, es: () => `«${cdmQ('#spPlotNote')}» Materia distinta, potencial idéntico.`, hl: '#spPlot' } },
      { en: () => 'Now the equal-moment example, near the origin…', es: () => 'Ahora el ejemplo de momentos iguales, cerca del origen…', click: '#mmExample' },
      { en: () => 'Plot range → near the origin', es: () => 'Rango → cerca del origen', set: ['#mmScale', 'local'],
        then: { en: () => `«${cdmQ('#mmStatus')}» The small-angle expansion matches…`, es: () => `«${cdmQ('#mmStatus')}» La expansión de ángulo pequeño coincide…`, hl: '#mmNumbers' } },
      { en: () => 'Plot range → the full phase interval', es: () => 'Rango → el intervalo de fase completo', set: ['#mmScale', 'full'],
        then: { en: () => `…but over the whole interval the two potentials separate. «${cdmQ('#mmProof')}»`, es: () => `…pero en todo el intervalo los dos potenciales se separan. «${cdmQ('#mmProof')}»`, hl: '#mmPlot' } },
    ],
    explain: {
      en: { title: '📊 How to read Same potential?', lines: ['<b>Same five coordinates ⟺ identically the same potential</b> (Theorem 3): the dashed curve riding on the solid one is the theorem, not a coincidence.', '<b>The canonical representative</b> is the unique content in each class: two contents have the same potential exactly when their canonical forms coincide.', '<b>Equal moments are weaker</b>: matching D, A₄ and G near the origin does not fix the global vacuum — judge it with the full potential.', '👉 <b>Now try it:</b> edit content B by hand and watch the coordinates and the verdict.'] },
      es: { title: '📊 Cómo leer ¿Mismo potencial?', lines: ['<b>Mismas cinco coordenadas ⟺ el mismo potencial idénticamente</b> (teorema 3): la curva discontinua sobre la continua es el teorema, no una coincidencia.', '<b>El representante canónico</b> es el contenido único de cada clase: dos contenidos tienen el mismo potencial exactamente cuando sus formas canónicas coinciden.', '<b>Igualar momentos es más débil</b>: coincidir en D, A₄ y G cerca del origen no fija el vacío global; júzgalo con el potencial completo.', '👉 <b>Pruébalo:</b> edita a mano el contenido B y mira las coordenadas y el veredicto.'] },
    },
  },

  collider: {
    model: cdmNone,
    steps: [
      { en: () => `Collider: which state does a dijet search bound? «${cdmQ('#clLead')}»`, es: () => `Collider: ¿qué estado acota una búsqueda de dijets? «${cdmQ('#clLead')}»`, hl: '#clLead' },
      { en: () => `The dictionary from this content to a collider: «${cdmQ('#clDict', 2)}»`, es: () => `El diccionario de este contenido al colisionador: «${cdmQ('#clDict', 2)}»`, hl: '#clDict' },
      { en: () => 'Move the dijet probe…', es: () => 'Mueve la sonda de dijets…', set: ['#clMjj', 5.2],
        then: { en: () => `«${cdmQ('#clProbe')}» The ratio is exact at tree level on the t-channel subprocess.`, es: () => `«${cdmQ('#clProbe')}» El cociente es exacto a nivel árbol en el subproceso de canal t.`, hl: '#clProbe' } },
      { en: () => `Against the data: «${cdmQ('#clTeeth')}»`, es: () => `Frente a los datos: «${cdmQ('#clTeeth')}»`, hl: '#clTeeth' },
      { en: () => `What the table is: «${cdmQ('#clBinsNote', 2)}»`, es: () => `Qué es la tabla: «${cdmQ('#clBinsNote', 2)}»`, hl: '#clBinsNote' },
      { en: () => 'Further down, the first KK gluon card compares this state with the ATLAS tt̄ and CMS dijet resonance limits and the CMS m(tt̄) spectrum — it has its own 🎬 Demo.',
        es: () => 'Más abajo, la tarjeta del primer gluón KK compara este estado con los límites de resonancias de ATLAS (tt̄) y CMS (dijets) y con el espectro m(tt̄) de CMS: tiene su propia 🎬 Demo.',
        hl: '#rx_kkgluon h2' },
    ],
    explain: {
      en: { title: '📊 How to read Collider', lines: ['<b>M₁ = 1/R₅</b> and <b>Γ/M = 2α_s</b> follow from the content with no free parameter: colour in the bulk couples the tower at √2 g_s.', '<b>The probe</b> gives the exact tree-level ratio of the tower to QCD at one point of the CMS angular binning.', '<b>Δχ²</b> values are quoted from the published recast; a new reinterpretation needs the GHU signal, selections and a statistical model.', '👉 <b>Now try it:</b> change χ and M_jj and watch where the tower departs from QCD.'] },
      es: { title: '📊 Cómo leer Collider', lines: ['<b>M₁ = 1/R₅</b> y <b>Γ/M = 2α_s</b> salen del contenido sin parámetros libres: el color en el bulk acopla la torre a √2 g_s.', '<b>La sonda</b> da el cociente exacto a nivel árbol de la torre frente a QCD en un punto del binning angular de CMS.', '<b>Los Δχ²</b> se citan del recast publicado; una reinterpretación nueva necesita la señal de GHU, las selecciones y un modelo estadístico.', '👉 <b>Pruébalo:</b> cambia χ y M_jj y mira dónde se separa la torre de QCD.'] },
    },
  },

  predict: {
    model: cdmNone,
    steps: [
      { en: () => 'Simulator: the model, in the numbers a detector measures. Three models live here: builder predictions, Higgs production with a top KK tower, and the neutrino ring.',
        es: () => 'Simulator: el modelo, en los números que mide un detector. Aquí viven tres modelos: predicciones del constructor, producción del Higgs con una torre KK del top y el anillo de neutrinos.',
        hl: '#prModel' },
      { en: () => `Builder mode, for the model in the SU(N) builder: «${cdmQ('#prReading', 2)}»`, es: () => `Modo constructor, para el modelo del constructor SU(N): «${cdmQ('#prReading', 2)}»`, hl: '#prReading' },
      { en: () => 'Switch to Higgs production with the top KK tower…', es: () => 'Cambia a producción del Higgs con la torre KK del top…', set: ['#prModel', 'higgsrate'],
        then: { en: () => `Gluon-fusion ratio R_gg = ${cdmQT('#hdRate')}. «${cdmQ('#hdSummary')}»`, es: () => `Cociente de fusión de gluones R_gg = ${cdmQT('#hdRate')}. «${cdmQ('#hdSummary')}»`, hl: '#hdRate' } },
      { en: () => 'Switch to the neutrino ring…', es: () => 'Cambia al anillo de neutrinos…', set: ['#prModel', 'neutrino'],
        then: { en: () => `«${cdmQ('#nrSummary', 2) || cdmQ('#prNeutrinoView')}»`, es: () => `«${cdmQ('#nrSummary', 2) || cdmQ('#prNeutrinoView')}»`, hl: '#nrSummary' } },
      { en: () => 'Back to the builder. Each mode has its own 🎬 Demo in the menu of this section, and its cards (three flavours, fixed light inputs, thermal) have theirs.',
        es: () => 'De vuelta al constructor. Cada modo tiene su propia 🎬 Demo en el menú de esta sección, y sus tarjetas (tres sabores, entradas ligeras fijas, térmica) las suyas.',
        set: ['#prModel', 'builder'] },
    ],
    explain: {
      en: { title: '📊 How to read Simulator', lines: ['<b>Builder</b>: the SU(N) builder model taken to its vacuum and turned into masses in GeV — only when the dictionary identifies a W to set the scale.', '<b>Higgs production</b>: the Carson–Okada top-tower ratio R_gg against a stated window.', '<b>Neutrino ring</b>: which heavy masses light-neutrino data leave undetermined.', '👉 <b>Now try it:</b> pick a mode and open its own 🎬 Demo from the menu.'] },
      es: { title: '📊 Cómo leer Simulator', lines: ['<b>Constructor</b>: el modelo del constructor SU(N) llevado a su vacío y convertido en masas en GeV, solo cuando el diccionario identifica un W que fije la escala.', '<b>Producción del Higgs</b>: el cociente R_gg de la torre del top de Carson–Okada frente a una ventana declarada.', '<b>Anillo de neutrinos</b>: qué masas pesadas dejan sin determinar los datos de neutrinos ligeros.', '👉 <b>Pruébalo:</b> elige un modo y abre su propia 🎬 Demo desde el menú.'] },
    },
  },
});

/* ---------- batch 2: Atlas, Anomalies & proton, Escape, Multiplets, Screen a table, and four Simulator modes ---------- */
const cdmMode = mode => [{ kind: 'set', selector: '#prModel', value: mode }];
Object.assign(CDM_DEMOS, {
  atlas7: {
    model: cdmNone,
    steps: [
      { en: () => `Atlas: every SU(7) bulk content of at most five multiplets, one tile each. «${cdmQ('#a7Lead')}»`,
        es: () => `Atlas: todos los contenidos de bulk de SU(7) con cinco multipletes como mucho, uno por casilla. «${cdmQ('#a7Lead')}»`, hl: '#a7Lead' },
      { en: () => 'Draw the whole lattice — the potentials are computed here, in your browser…', es: () => 'Dibuja la red entera: los potenciales se calculan aquí, en tu navegador…', click: '#a7Go',
        then: { en: () => `«${cdmQ('#a7Counts', 2)}»`, es: () => `«${cdmQ('#a7Counts', 2)}»`, hl: '#a7Canvas' } },
      { en: () => `Each tile is one potential; its colour says which verdict it gets. «${cdmQ('#a7Sel', 2)}»`, es: () => `Cada casilla es un potencial; su color dice qué veredicto recibe. «${cdmQ('#a7Sel', 2)}»`, hl: '#a7Sel' },
    ],
    explain: {
      en: { title: '📊 How to read Atlas', lines: ['<b>One tile, one content</b>: all 1 286 bulk contents of at most five multiplets, each with its own one-loop potential.', '<b>Colours</b> are verdicts: in the Higgs window, false vacuum, outside the window, no breaking.', '<b>Click a tile</b> to read its numbers; click again to load it into the model and every section follows.', '👉 <b>Now try it:</b> use the filters and load a tile near the window.'] },
      es: { title: '📊 Cómo leer Atlas', lines: ['<b>Una casilla, un contenido</b>: los 1 286 contenidos de bulk de cinco multipletes como mucho, cada uno con su potencial a un lazo.', '<b>Los colores</b> son veredictos: en la ventana del Higgs, falso vacío, fuera de la ventana, sin ruptura.', '<b>Pulsa una casilla</b> para leer sus números; púlsala otra vez para cargarla en el modelo, y todas las secciones la siguen.', '👉 <b>Pruébalo:</b> usa los filtros y carga una casilla cerca de la ventana.'] },
    },
  },

  anomalies: {
    model: cdmNone,
    steps: [
      { en: () => `Anomalies & proton: what each multiplet puts on the anomaly bill, in eighths, and what the proton-decay escape costs. «${cdmQ('#aLead', 2)}»`,
        es: () => `Anomalías y protón: qué pone cada multiplete en la factura de anomalías, en octavos, y qué cuesta el escape de la desintegración del protón. «${cdmQ('#aLead', 2)}»`, hl: '#aLead' },
      { en: () => `The signed contributions and the ladder: «${cdmQ('#aLadderNote')}»`, es: () => `Las contribuciones con signo y la escalera: «${cdmQ('#aLadderNote')}»`, hl: '#aBars' },
      { en: () => `The six anomaly channels: «${cdmQ('#aChan')}»`, es: () => `Los seis canales de anomalía: «${cdmQ('#aChan')}»`, hl: '#aChan' },
      { en: () => `Donating the host to the brane: «${cdmEsc(cdmFind('#aDon', /afford/i))} ${cdmEsc(cdmFind('#aDon', /After donation/))}»`, es: () => `Donar el anfitrión a la brana: «${cdmEsc(cdmFind('#aDon', /afford/i))} ${cdmEsc(cdmFind('#aDon', /After donation/))}»`, hl: '#aDon' },
      { en: () => `The five published rows, after paying the escape: (1) 8D = ${cdmQT('#ad0')}, m_h ${cdmQT('#am0')} — ${cdmQT('#av0')}; (2) ${cdmQT('#ad1')}, ${cdmQT('#am1')} — ${cdmQT('#av1')}; (3) ${cdmQT('#ad2')} — ${cdmQT('#av2')}.`,
        es: () => `Las cinco filas publicadas, tras pagar el escape: (1) 8D = ${cdmQT('#ad0')}, m_h ${cdmQT('#am0')}: ${cdmQT('#av0')}; (2) ${cdmQT('#ad1')}, ${cdmQT('#am1')}: ${cdmQT('#av1')}; (3) ${cdmQT('#ad2')}: ${cdmQT('#av2')}.`, hl: '#aRows' },
      { en: () => `Across the whole catalogue: «${cdmQ('#aCatNote')}»`, es: () => `En todo el catálogo: «${cdmQ('#aCatNote')}»`, hl: '#aCatNote' },
    ],
    explain: {
      en: { title: '📊 How to read Anomalies & proton', lines: ['<b>The bill</b> adds each multiplet\'s signed contribution in eighths; a nonzero bulk bill is not an inconsistency — brane fermions pay into the same channels.', '<b>The escape</b> costs 10/8 of D: a content can afford it only if D stays positive afterwards.', '<b>The table</b> applies that to the five published rows; the catalogue shows which contents can pay.', '👉 <b>Now try it:</b> load another content (Atlas or the header) and watch the bill and the escape.'] },
      es: { title: '📊 Cómo leer Anomalías y protón', lines: ['<b>La factura</b> suma la contribución con signo de cada multiplete en octavos; una factura de bulk distinta de cero no es una inconsistencia: los fermiones de brana pagan en los mismos canales.', '<b>El escape</b> cuesta 10/8 de D: un contenido solo puede pagarlo si D sigue siendo positivo después.', '<b>La tabla</b> lo aplica a las cinco filas publicadas; el catálogo muestra qué contenidos pueden pagar.', '👉 <b>Pruébalo:</b> carga otro contenido (Atlas o la cabecera) y mira la factura y el escape.'] },
    },
  },

  escape: {
    model: cdmNone,
    steps: [
      { en: () => `Escape from proton decay, constructed: «${cdmQ('#egLead')}»`, es: () => `El escape de la desintegración del protón, construido: «${cdmQ('#egLead')}»`, hl: '#egLead' },
      { en: () => `The six anomaly channels for this brane content: «${cdmQ('#egChanV')}»`, es: () => `Los seis canales de anomalía para este contenido de brana: «${cdmQ('#egChanV')}»`, hl: '#egChanV' },
      { en: () => 'Choose the scalar charge that comes from the 84…', es: () => 'Elige la carga escalar que viene del 84…', button: '3/2 · 84',
        then: { en: () => `«${cdmQ('#egSelV', 2)}»`, es: () => `«${cdmQ('#egSelV', 2)}»`, hl: '#egSelV' } },
      { en: () => `Every assignment, enumerated: «${cdmQ('#egAsgLead')}»`, es: () => `Todas las asignaciones, enumeradas: «${cdmQ('#egAsgLead')}»`, hl: '#egAsgLead' },
      { en: () => `And what it costs the potential: «${cdmQ('#egBillV')}»`, es: () => `Y lo que le cuesta al potencial: «${cdmQ('#egBillV')}»`, hl: '#egBillV' },
    ],
    explain: {
      en: { title: '📊 How to read Escape from proton decay', lines: ['<b>Rungs and X_Q</b> fix the brane content; the six anomaly channels and the proton-operator charges recompute together.', '<b>The scalar charge</b> decides which residual discrete symmetry protects the proton — or why none can.', '<b>The bill</b> is what the escape costs the bulk potential, in units of D.', '👉 <b>Now try it:</b> put generations on other rungs and watch which channels cancel.'] },
      es: { title: '📊 Cómo leer Escape de la desintegración del protón', lines: ['<b>Los peldaños y X_Q</b> fijan el contenido de brana; los seis canales de anomalía y las cargas de los operadores del protón se recalculan juntos.', '<b>La carga escalar</b> decide qué simetría discreta residual protege al protón, o por qué ninguna puede.', '<b>La factura</b> es lo que el escape le cuesta al potencial de bulk, en unidades de D.', '👉 <b>Pruébalo:</b> pon las generaciones en otros peldaños y mira qué canales se cancelan.'] },
    },
  },

  multiplets: {
    model: cdmNone,
    steps: [
      { en: () => `Multiplets & parities: the layer under the term tables. «${cdmQ('#mpModel')}»`, es: () => `Multipletes y paridades: la capa bajo las tablas de términos. «${cdmQ('#mpModel')}»`, hl: '#mpModel' },
      { en: () => 'Select the 84…', es: () => 'Selecciona el 84…', button: '84',
        then: { en: () => `«${cdmQ('#mpLead', 2)}»`, es: () => `«${cdmQ('#mpLead', 2)}»`, hl: '#mpLead' } },
      { en: () => 'Now give it the parities (+,−)…', es: () => 'Dale ahora las paridades (+,−)…', button: '(+,−)',
        then: { en: () => `«${cdmQ('#mpLead', 2)}» The cube shows where the states sit; green and blue are left- and right-handed zero modes.`, es: () => `«${cdmQ('#mpLead', 2)}» El cubo muestra dónde están los estados; verde y azul son modos cero levógiros y dextrógiros.`, hl: '#mpCube' } },
      { en: () => `The term table, derived here and compared with the one the potential uses: «${cdmEsc(cdmLast('#mpTerms'))}»`,
        es: () => `La tabla de términos, derivada aquí y contrastada con la que usa el potencial: «${cdmEsc(cdmLast('#mpTerms'))}»`, hl: '#mpTerms' },
    ],
    explain: {
      en: { title: '📊 How to read Multiplets & parities', lines: ['<b>Each representation</b> breaks into multiplets with three Z₂ parities; a multiplet keeps a left- or right-handed zero mode only where its parities allow one, and the rest are lifted by the orbifold.', '<b>The cube</b> places the states by parity; the table lists multiplets, states and charges.', '<b>The term table</b> is derived here and checked against the one the potential uses.', '👉 <b>Now try it:</b> pick another representation and parity and count the zero modes.'] },
      es: { title: '📊 Cómo leer Multipletes y paridades', lines: ['<b>Cada representación</b> se rompe en multipletes con tres paridades Z₂; un multiplete conserva un modo cero levógiro o dextrógiro solo donde sus paridades lo permiten, y el resto los levanta el orbifold.', '<b>El cubo</b> coloca los estados por paridad; la tabla lista multipletes, estados y cargas.', '<b>La tabla de términos</b> se deriva aquí y se contrasta con la que usa el potencial.', '👉 <b>Pruébalo:</b> elige otra representación y paridad y cuenta los modos cero.'] },
    },
  },

  screen: {
    model: cdmNone,
    steps: [
      { en: () => `Screen a table: arithmetic screens for a published row. «${cdmQ('#scLead')}»`, es: () => `Criba una tabla: cribas aritméticas para una fila publicada. «${cdmQ('#scLead')}»`, hl: '#scLead' },
      { en: () => `The content law: «${cdmQ('#scLaws')}»`, es: () => `La ley del contenido: «${cdmQ('#scLaws')}»`, hl: '#scLaws' },
      { en: () => `The K screen: «${cdmQ('#scKV', 2)}»`, es: () => `La criba K: «${cdmQ('#scKV', 2)}»`, hl: '#scKV' },
      { en: () => 'Type a candidate resonance at 4000 GeV…', es: () => 'Escribe una resonancia candidata a 4000 GeV…', set: ['#sci_MKK', 4000],
        then: { en: () => `«${cdmQ('#scHits', 2)}»`, es: () => `«${cdmQ('#scHits', 2)}»`, hl: '#scHits' } },
      { en: () => `The five published rows, at their own α: «${cdmQ('#scFiveNote')}»`, es: () => `Las cinco filas publicadas, en su propia α: «${cdmQ('#scFiveNote')}»`, hl: '#scFive' },
      { en: () => `«${cdmQ('#scCertifiedSU7')}»`, es: () => `«${cdmQ('#scCertifiedSU7')}»`, hl: '#scCertifiedSU7' },
    ],
    explain: {
      en: { title: '📊 How to read Screen a table', lines: ['<b>Three screens</b> — the content law, the K screen and the comb — test a printed row without recomputing the foreign model.', '<b>The comb</b> places a candidate M_KK against the rungs; bounds hold only under their registered conventions.', '<b>Certificates</b>: 26 Lean theorems and interval proofs for ten global minima, downloadable as JSON.', '👉 <b>Now try it:</b> type the α and m_h of another published row and read the three screens.'] },
      es: { title: '📊 Cómo leer Criba una tabla', lines: ['<b>Tres cribas</b> (la ley del contenido, la criba K y el peine) ponen a prueba una fila impresa sin recalcular el modelo ajeno.', '<b>El peine</b> coloca una M_KK candidata frente a los peldaños; las cotas valen solo con sus convenciones registradas.', '<b>Certificados</b>: 26 teoremas de Lean y pruebas de intervalos para diez mínimos globales, descargables en JSON.', '👉 <b>Pruébalo:</b> escribe la α y la m_h de otra fila publicada y lee las tres cribas.'] },
    },
  },

  'higgs-production': {
    pre: cdmMode('higgsrate'),
    model: cdmNone,
    steps: [
      { en: () => `Higgs production with a top Kaluza–Klein tower (Carson–Okada): the gluon-fusion ratio R_gg = ${cdmQT('#hdRate')} at M_KK = ${cdmV('#hdScale')} GeV, against the window ${cdmQT('#hdInterval')}.`,
        es: () => `Producción del Higgs con una torre de Kaluza–Klein del top (Carson–Okada): el cociente de fusión de gluones R_gg = ${cdmQT('#hdRate')} con M_KK = ${cdmV('#hdScale')} GeV, frente a la ventana ${cdmQT('#hdInterval')}.`, hl: '#hdRate' },
      { en: () => `«${cdmQ('#hdSummary', 2)}»`, es: () => `«${cdmQ('#hdSummary', 2)}»`, hl: '#hdSummary' },
      { en: () => 'Lower the KK scale to 1500 GeV…', es: () => 'Baja la escala KK a 1500 GeV…', set: ['#hdScale', 1500],
        then: { en: () => `At 1.5 TeV: R_gg = ${cdmQT('#hdRate')}. «${cdmQ('#hdSummary')}»`, es: () => `A 1,5 TeV: R_gg = ${cdmQT('#hdRate')}. «${cdmQ('#hdSummary')}»`, hl: '#hdCurve' } },
      { en: () => `How the finite tower converges: «${cdmQ('#hdTail')}»`, es: () => `Cómo converge la torre finita: «${cdmQ('#hdTail')}»`, hl: '#hdConvergence' },
    ],
    explain: {
      en: { title: '📊 How to read Higgs production · top KK', lines: ['<b>R_gg</b> is the gluon-fusion rate relative to the SM, from the Carson–Okada top-tower calculation.', '<b>The window</b> is the stated comparison interval, not a fit; the convergence plot shows how many KK modes matter.', 'This reference answers one specific question; it is not the SU(N) builder model.', '👉 <b>Now try it:</b> move the KK scale and watch R_gg cross the window.'] },
      es: { title: '📊 Cómo leer Producción del Higgs · KK del top', lines: ['<b>R_gg</b> es la tasa de fusión de gluones relativa al SM, del cálculo de la torre del top de Carson–Okada.', '<b>La ventana</b> es el intervalo de comparación declarado, no un ajuste; la gráfica de convergencia muestra cuántos modos KK importan.', 'Esta referencia responde a una pregunta concreta; no es el modelo del constructor SU(N).', '👉 <b>Pruébalo:</b> mueve la escala KK y mira cuándo R_gg cruza la ventana.'] },
    },
  },

  'neutrino-ring': {
    pre: cdmMode('neutrino'),
    model: cdmNone,
    steps: [
      { en: () => `The neutrino ring, calibrated: light mass ${cdmQT('#nrLight')}, active-current deficit ${cdmQT('#nrDeficit')}, first heavy-pair split ${cdmQT('#nrSplit')}.`,
        es: () => `El anillo de neutrinos, calibrado: masa ligera ${cdmQT('#nrLight')}, déficit de corriente activa ${cdmQT('#nrDeficit')}, desdoblamiento del primer par pesado ${cdmQT('#nrSplit')}.`, hl: '#nrLight' },
      { en: () => `«${cdmQ('#nrSummary', 2)}»`, es: () => `«${cdmQ('#nrSummary', 2)}»`, hl: '#nrSummary' },
      { en: () => 'Set the Majorana term μB to zero…', es: () => 'Pon el término de Majorana μB a cero…', click: '#nrNoB',
        then: { en: () => `μB = 0: split ${cdmQT('#nrSplit')}, light mass ${cdmQT('#nrLight')}.`, es: () => `μB = 0: desdoblamiento ${cdmQT('#nrSplit')}, masa ligera ${cdmQT('#nrLight')}.`, hl: '#nrSplit' } },
      { en: () => '…and now to 5000 keV', es: () => '…y ahora a 5000 keV', click: '#nrHighB',
        then: { en: () => `μB = 5000 keV: split ${cdmQT('#nrSplit')}, light mass still ${cdmQT('#nrLight')} — the heavy splitting carries information the light mass does not.`, es: () => `μB = 5000 keV: desdoblamiento ${cdmQT('#nrSplit')}, masa ligera todavía ${cdmQT('#nrLight')}: el desdoblamiento pesado lleva información que la masa ligera no tiene.`, hl: '#nrSweep' } },
    ],
    explain: {
      en: { title: '📊 How to read the neutrino ring', lines: ['<b>Calibration</b> holds the light mass and the active deficit fixed while the couplings are reconstructed.', '<b>The heavy pairs</b> can move with no trace in the light sector: their splitting is what μB controls.', 'A four-dimensional research model, independent of the SU(N) builder.', '👉 <b>Now try it:</b> move the links and portals and watch which numbers stay fixed.'] },
      es: { title: '📊 Cómo leer el anillo de neutrinos', lines: ['<b>La calibración</b> mantiene fijos la masa ligera y el déficit activo mientras se reconstruyen los acoplos.', '<b>Los pares pesados</b> pueden moverse sin dejar rastro en el sector ligero: su desdoblamiento es lo que controla μB.', 'Un modelo de investigación en cuatro dimensiones, independiente del constructor SU(N).', '👉 <b>Pruébalo:</b> mueve los enlaces y los portales y mira qué números quedan fijos.'] },
    },
  },

  'cms-hnl': {
    pre: cdmMode('neutrino'),
    model: cdmNone,
    steps: [
      { en: () => `Against CMS heavy-neutral-lepton searches: «${cdmQ('#nrExperimentalSummary', 2)}»`, es: () => `Frente a las búsquedas de leptones neutros pesados de CMS: «${cdmQ('#nrExperimentalSummary', 2)}»`, hl: '#nrLimitsPlot' },
      { en: () => 'Choose the muon flavour…', es: () => 'Elige el sabor muónico…', set: ['#nrFlavour', 'muon'] },
      { en: () => '…and the Majorana reference', es: () => '…y la referencia de Majorana', set: ['#nrKind', 'majorana'],
        then: { en: () => `«${cdmQ('#nrExperimentalSummary', 2)}» The overlay is a reference ratio, not a likelihood.`, es: () => `«${cdmQ('#nrExperimentalSummary', 2)}» La superposición es un cociente de referencia, no una verosimilitud.`, hl: '#nrLimitsPlot' } },
      { en: () => `Where the curves come from: «${cdmQ('#nrDatasetSource')}»`, es: () => `De dónde salen las curvas: «${cdmQ('#nrDatasetSource')}»`, hl: '#nrDatasetSource' },
    ],
    explain: {
      en: { title: '📊 How to read the CMS HNL comparison', lines: ['<b>Observed and expected curves</b> with their bands are CMS\'s published limits, for the flavour and Dirac/Majorana hypothesis you choose.', '<b>The ring overlay</b> places the model\'s mixing at its heavy masses; it is a reference ratio, not a likelihood.', '👉 <b>Now try it:</b> switch flavour and hypothesis and read the ratios in the table.'] },
      es: { title: '📊 Cómo leer la comparación con HNL de CMS', lines: ['<b>Las curvas observada y esperada</b> con sus bandas son los límites publicados por CMS, para el sabor y la hipótesis Dirac/Majorana que elijas.', '<b>La superposición del anillo</b> coloca la mezcla del modelo en sus masas pesadas; es un cociente de referencia, no una verosimilitud.', '👉 <b>Pruébalo:</b> cambia de sabor y de hipótesis y lee los cocientes en la tabla.'] },
    },
  },

  decays: {
    pre: cdmMode('neutrino'),
    model: cdmNone,
    steps: [
      { en: () => `Decays of heavy pair ${cdmV('#ndPair')}: total width ${cdmQT('#ndWidth')}, proper decay length cτ ${cdmQT('#ndLifetime')}. «${cdmQ('#ndSummary')}»`,
        es: () => `Desintegraciones del par pesado ${cdmV('#ndPair')}: anchura total ${cdmQT('#ndWidth')}, longitud de desintegración propia cτ ${cdmQT('#ndLifetime')}. «${cdmQ('#ndSummary')}»`, hl: '#ndCard' },
      { en: () => 'Include the calculated Majoron channels…', es: () => 'Incluye los canales de Majoron calculados…', set: ['#ndMajoron', true],
        then: { en: () => `Width ${cdmQT('#ndWidth')}, proper decay length cτ ${cdmQT('#ndLifetime')}: width and decay length respond together. «${cdmQ('#ndMajoronSummary')}»`, es: () => `Anchura ${cdmQT('#ndWidth')}, longitud de desintegración propia cτ ${cdmQT('#ndLifetime')}: la anchura y la longitud de desintegración responden juntas. «${cdmQ('#ndMajoronSummary')}»`, hl: '#ndFractionsPlot' } },
      { en: () => 'Set the fixed boost to 10…', es: () => 'Pon el boost fijo en 10…', set: ['#ndBoost', 10],
        then: { en: () => `«${cdmQ('#ndFlightNote')}» A supplied kinematic scenario, not a detector acceptance.`, es: () => `«${cdmQ('#ndFlightNote')}» Un escenario cinemático supuesto, no una aceptancia de detector.`, hl: '#ndFlightPlot' } },
    ],
    explain: {
      en: { title: '📊 How to read Decays', lines: ['<b>Partial widths</b> to W, Z and the SM Higgs follow from the same six masses and active weights; Majoron channels are optional and calculated.', '<b>Lifetime and flight</b> follow from the total width and a boost you supply; no detector acceptance is integrated.', '👉 <b>Now try it:</b> pick another heavy pair and add an extra width as a separate hypothesis.'] },
      es: { title: '📊 Cómo leer Desintegraciones', lines: ['<b>Las anchuras parciales</b> a W, Z y el Higgs del SM salen de las mismas seis masas y pesos activos; los canales de Majoron son opcionales y calculados.', '<b>La vida media y el vuelo</b> salen de la anchura total y de un boost que tú das; no se integra ninguna aceptancia de detector.', '👉 <b>Pruébalo:</b> elige otro par pesado y añade una anchura extra como hipótesis aparte.'] },
    },
  },
});

/* ---------- batch 3: the remaining sections. Frames are short; the substance is quoted from the page; the closing
 * panel is the user guide's own reading (explain: 'guide'). ---------- */
const cdmQQ = (sel, n = 1) => `«${cdmQ(sel, n)}»`;
const cdmSec = (steps) => ({ model: cdmNone, steps, explain: 'guide' });
Object.assign(CDM_DEMOS, {
  inverse: cdmSec([
    { en: () => `Inverse: choose a compactification scale and design a content for it. ${cdmQQ('#ivAxisNote')}`, es: () => `Inverse: elige una escala de compactificación y diseña un contenido para ella. ${cdmQQ('#ivAxisNote')}`, hl: '#ivAxisNote' },
    { en: () => 'Ask for 2 TeV…', es: () => 'Pide 2 TeV…', set: ['#ivTarget', 2] },
    { en: () => '…and design it', es: () => '…y diséñalo', click: '#ivGo',
      then: { en: () => cdmQQ('#ivVerdict', 2), es: () => cdmQQ('#ivVerdict', 2), hl: '#ivVerdict' } },
    { en: () => `The enumeration behind it: ${cdmQQ('#ivProbe')}`, es: () => `La enumeración que hay detrás: ${cdmQQ('#ivProbe')}`, hl: '#ivProbe' },
  ]),
  census: cdmSec([
    { en: () => `Census: how many contents sit on each rung — counted exactly, not searched. ${cdmQQ('#cnTotalsNote')}`, es: () => `Census: cuántos contenidos hay en cada peldaño, contados exactamente, no buscados. ${cdmQQ('#cnTotalsNote')}`, hl: '#cnTotalsNote' },
    { en: () => 'Click the plot to move the probe…', es: () => 'Pulsa la gráfica para mover la sonda…', act: { kind: 'canvasClick', selector: '#cnCurve', x: 0.65, y: 0.45 },
      then: { en: () => cdmQQ('#cnCurveNote', 2), es: () => cdmQQ('#cnCurveNote', 2), hl: '#cnCurve' } },
    { en: () => `The recursion that makes the curves superpose: ${cdmQQ('#cnRec')}`, es: () => `La recursión que hace que las curvas se superpongan: ${cdmQQ('#cnRec')}`, hl: '#cnRec' },
    { en: () => `Many contents, one potential: ${cdmQQ('#cnFibre')}`, es: () => `Muchos contenidos, un potencial: ${cdmQQ('#cnFibre')}`, hl: '#cnFibre' },
  ]),
  selection: cdmSec([
    { en: () => `Selection rule: when can the vacuum search use half the torus? ${cdmQQ('#sLead')}`, es: () => `Regla de selección: ¿cuándo puede la búsqueda del vacío usar medio toro? ${cdmQQ('#sLead')}`, hl: '#sLead' },
    { en: () => cdmQQ('#sCheck'), es: () => cdmQQ('#sCheck'), hl: '#sCheck' },
    { en: () => 'Select the representation (1,0,1)…', es: () => 'Selecciona la representación (1,0,1)…', button: '(1,0,1)',
      then: { en: () => cdmQQ('#sVerdict', 2), es: () => cdmQQ('#sVerdict', 2), hl: '#sVerdict' } },
    { en: () => `Across every representation: ${cdmQQ('#sReduce')}`, es: () => `En todas las representaciones: ${cdmQQ('#sReduce')}`, hl: '#sReduce' },
  ]),
  calculator: cdmSec([
    { en: () => `Model calculator (SU(4)): ${cdmQQ('#cLead')}`, es: () => `Calculadora de modelos (SU(4)): ${cdmQQ('#cLead')}`, hl: '#cLead' },
    { en: () => `The anchor: ${cdmQQ('#cAnchor')}`, es: () => `El ancla: ${cdmQQ('#cAnchor')}`, hl: '#cAnchor' },
    { en: () => 'Load the published AHMN content…', es: () => 'Carga el contenido publicado de AHMN…', click: '#cAhmn',
      then: { en: () => `Vacuum α = (${cdmQT('#cA')}), mass ratio ${cdmQT('#cR')}, masses ${cdmQT('#cM')} GeV, mixing ${cdmQT('#cX')}. ${cdmQQ('#cVd')}`, es: () => `Vacío α = (${cdmQT('#cA')}), cociente de masas ${cdmQT('#cR')}, masas ${cdmQT('#cM')} GeV, mezcla ${cdmQT('#cX')}. ${cdmQQ('#cVd')}`, hl: '#cA' } },
  ]),
  eta: cdmSec([
    { en: () => `eta-meter: what flipping the boundary sign η does to the Higgs mass matrix. ${cdmQQ('#eLead')}`, es: () => `eta-meter: qué le hace a la matriz de masas del Higgs invertir el signo de frontera η. ${cdmQQ('#eLead')}`, hl: '#eLead' },
    { en: () => cdmQQ('#eCheck'), es: () => cdmQQ('#eCheck'), hl: '#eCheck' },
    { en: () => 'Load nine copies of a blind multiplet…', es: () => 'Carga nueve copias de un multiplete ciego…', click: '#eBlindLoad',
      then: { en: () => cdmQQ('#eBlind'), es: () => cdmQQ('#eBlind'), hl: '#eBlind' } },
    { en: () => '…and flip every η', es: () => '…e invierte todas las η', click: '#eFlip',
      then: { en: () => cdmQQ('#eLead'), es: () => cdmQQ('#eLead'), hl: '#eLead' } },
  ]),
  fived: cdmSec([
    { en: () => `5D model (SU(2)/SU(3)): ${cdmQQ('#fvLead')}`, es: () => `Modelo 5D (SU(2)/SU(3)): ${cdmQQ('#fvLead')}`, hl: '#fvLead' },
    { en: () => 'Clear to pure gauge…', es: () => 'Limpia hasta gauge puro…', click: '#fvClear' },
    { en: () => '…and load the marginal trio', es: () => '…y carga el trío marginal', click: '#fvMarginal',
      then: { en: () => `${cdmQQ('#fvV')} ${cdmQQ('#fvBlindV')}`, es: () => `${cdmQQ('#fvV')} ${cdmQQ('#fvBlindV')}`, hl: '#fvV' } },
    { en: () => `Against the published values: ${cdmQQ('#fvVgiqV', 2)}`, es: () => `Frente a los valores publicados: ${cdmQQ('#fvVgiqV', 2)}`, hl: '#fvVgiqV' },
  ]),
  sun5d: cdmSec([
    { en: () => `SU(N) builder: boundary conditions, bulk matter, the potential and its vacuum. ${cdmQQ('#sunBC')}`, es: () => `Constructor SU(N): condiciones de frontera, materia de bulk, el potencial y su vacío. ${cdmQQ('#sunBC')}`, hl: '#sunBC' },
    { en: () => 'Load the paper\'s §4.3 example: SU(6) with P ≠ P′…', es: () => 'Carga el ejemplo §4.3 del artículo: SU(6) con P ≠ P′…', button: '§4.3 · SU(6), P ≠ P′',
      then: { en: () => cdmQQ('#sunVac', 2), es: () => cdmQQ('#sunVac', 2), hl: '#sunVac' } },
    { en: () => cdmQQ('#sunBridge'), es: () => cdmQQ('#sunBridge'), hl: '#sunBridge' },
  ]),
  papers: cdmSec([
    { en: () => `Paper models: four published GHU models, every printed statement recomputed. ${cdmQQ('#papSum', 2)}`, es: () => `Paper models: cuatro modelos de GHU publicados, cada afirmación impresa recalculada. ${cdmQQ('#papSum', 2)}`, hl: '#papSum' },
    { en: () => 'Change the number of triplet fermions to 5…', es: () => 'Cambia el número de fermiones triplete a 5…', set: ['#papNf', 5],
      then: { en: () => `${cdmQQ('#papKnob', 2)} ${cdmQQ('#papSum')}`, es: () => `${cdmQQ('#papKnob', 2)} ${cdmQQ('#papSum')}`, hl: '#papKnob' } },
    { en: () => `Load into the SU(N) builder: ${cdmQQ('#papLoadNote')}`, es: () => `Cargar en el constructor SU(N): ${cdmQQ('#papLoadNote')}`, hl: '#papLoad' },
  ]),
  spectrum5d: cdmSec([
    { en: () => `4D spectrum: every field's Kaluza–Klein tower at the vacuum. ${cdmQQ('#spZeroNote')}`, es: () => `Espectro 4D: la torre de Kaluza–Klein de cada campo en el vacío. ${cdmQQ('#spZeroNote')}`, hl: '#spZeroNote' },
    { en: () => 'Load the paper\'s §4.3 SU(6) with four fundamentals…', es: () => 'Carga el SU(6) del §4.3 con cuatro fundamentales…', click: '#spExample',
      then: { en: () => cdmQQ('#spZeroNote'), es: () => cdmQQ('#spZeroNote'), hl: '#spZeroNote' } },
    { en: () => 'Move the Wilson phase to θ = 0.1…', es: () => 'Mueve la fase de Wilson a θ = 0,1…', set: ['#spTheta', 0.1],
      then: { en: () => cdmQQ('#spThetaNote'), es: () => cdmQQ('#spThetaNote'), hl: '#section canvas' } },
    { en: () => cdmQQ('#spCross'), es: () => cdmQQ('#spCross'), hl: '#spCross' },
  ]),
  anomaly5d: cdmSec([
    { en: () => `5D anomalies: the anomaly of the massless fermions, channel by channel. ${cdmQQ('#anVerdict')}`, es: () => `Anomalías 5D: la anomalía de los fermiones sin masa, canal a canal. ${cdmQQ('#anVerdict')}`, hl: '#anVerdict' },
    { en: () => 'Load the paper\'s §4.3 SU(6) with four fundamentals…', es: () => 'Carga el SU(6) del §4.3 con cuatro fundamentales…', click: '#anExample',
      then: { en: () => cdmQQ('#anVerdict', 2), es: () => cdmQQ('#anVerdict', 2), hl: '#anVerdict' } },
    { en: () => cdmQQ('#anHonesty'), es: () => cdmQQ('#anHonesty'), hl: '#anHonesty' },
  ]),
  brane: cdmSec([
    { en: () => `Brane content: what the fixed points can hold, and the anomaly ledger with it. ${cdmQQ('#brFixedNote')}`, es: () => `Contenido de brana: qué pueden albergar los puntos fijos, y la factura de anomalías con él. ${cdmQQ('#brFixedNote')}`, hl: '#brFixedNote' },
    { en: () => 'Load Kawamura\'s SU(5)…', es: () => 'Carga el SU(5) de Kawamura…', click: '#brExample',
      then: { en: () => cdmQQ('#brFixedNote'), es: () => cdmQQ('#brFixedNote'), hl: '#brFixedNote' } },
    { en: () => 'Solve the linear channels for the charges…', es: () => 'Resuelve los canales lineales para las cargas…', click: '#brSolve',
      then: { en: () => cdmQQ('#brSolveOut', 2), es: () => cdmQQ('#brSolveOut', 2), hl: '#brSolveOut' } },
    { en: () => cdmQQ('#brVerdict'), es: () => cdmQQ('#brVerdict'), hl: '#brVerdict' },
  ]),
  sweep5d: cdmSec([
    { en: () => `Sweep: walk boundary conditions and bulk contents and filter them. ${cdmQQ('#swSizeNote')}`, es: () => `Barrido: recorre condiciones de frontera y contenidos de bulk y fíltralos. ${cdmQQ('#swSizeNote')}`, hl: '#swSizeNote' },
    { en: () => 'Run the sweep…', es: () => 'Ejecuta el barrido…', click: '#swRun',
      then: { en: () => cdmQQ('#swVerdict', 2), es: () => cdmQQ('#swVerdict', 2), hl: '#swVerdict' } },
    { en: () => cdmQQ('#swHonesty'), es: () => cdmQQ('#swHonesty'), hl: '#swHonesty' },
  ]),
  dossier: cdmSec([
    { en: () => `One model, every verdict — and which of them are about the theory. ${cdmQQ('#dsHead')}`, es: () => `Un modelo, todos los veredictos, y cuáles de ellos tratan de la teoría. ${cdmQQ('#dsHead')}`, hl: '#dsHead' },
    { en: () => 'Load the section\'s demonstration model, whose class has several members…', es: () => 'Carga el modelo de demostración de la sección, cuya clase tiene varios miembros…', act: { kind: 'demoStart' },
      then: { en: () => cdmQQ('#dsHead'), es: () => cdmQQ('#dsHead'), hl: '#dsHead' } },
    { en: () => 'Pick another member of the equivalence class…', es: () => 'Elige otro miembro de la clase de equivalencia…', click: '#section [data-bc="0,1,5,0"]',
      then: { en: () => cdmQQ('#dsReading'), es: () => cdmQQ('#dsReading'), hl: '#dsReading' } },
    { en: () => cdmQQ('#dsHonesty'), es: () => cdmQQ('#dsHonesty'), hl: '#dsHonesty' },
  ]),
  bcclass: cdmSec([
    { en: () => `Classify the boundary conditions: ${cdmQQ('#bccWhich')}`, es: () => `Clasifica las condiciones de frontera: ${cdmQQ('#bccWhich')}`, hl: '#bccWhich' },
    { en: () => 'Switch the orbifold to T²/Z₃…', es: () => 'Cambia el orbifold a T²/Z₃…', button: 'T²/Z₃',
      then: { en: () => cdmQQ('#bccWhich'), es: () => cdmQQ('#bccWhich'), hl: '#bccWhich' } },
    { en: () => cdmQQ('#bccEnergy'), es: () => cdmQQ('#bccEnergy'), hl: '#bccEnergy' },
  ]),
  orbifold: cdmSec([
    { en: () => `Classify an orbifold: ${cdmQQ('#orbCap')}`, es: () => `Clasifica un orbifold: ${cdmQQ('#orbCap')}`, hl: '#orbCap' },
    { en: () => 'Choose T²/Z₄…', es: () => 'Elige T²/Z₄…', button: 'T²/Z₄' },
    { en: () => '…and classify it', es: () => '…y clasifícalo', click: '#orbGo',
      then: { en: () => `${cdmQQ('#orbCap')} ${cdmQQ('#orbSeries')}`, es: () => `${cdmQQ('#orbCap')} ${cdmQQ('#orbSeries')}`, hl: '#orbCap' } },
    { en: () => `Reading one boundary condition: ${cdmQQ('#orbBCv')}`, es: () => `Leyendo una condición de frontera: ${cdmQQ('#orbBCv')}`, hl: '#orbBCv' },
  ]),
  relations: cdmSec([
    { en: () => `Relations: the moves that connect boundary conditions in one class. ${cdmQQ('#relDict')}`, es: () => `Relaciones: los movimientos que conectan condiciones de frontera de una clase. ${cdmQQ('#relDict')}`, hl: '#relDict' },
    { en: () => 'Choose T²/Z₄…', es: () => 'Elige T²/Z₄…', button: 'T²/Z₄' },
    { en: () => '…and judge the move 7 8 → 5 6', es: () => '…y juzga el movimiento 7 8 → 5 6', click: '#relJudge',
      then: { en: () => cdmQQ('#relMoveV'), es: () => cdmQQ('#relMoveV'), hl: '#relMoveV' } },
    { en: () => cdmQQ('#relVerdict'), es: () => cdmQQ('#relVerdict'), hl: '#relVerdict' },
  ]),
  cbclass: cdmSec([
    { en: () => `Classify continuous boundary conditions: ${cdmQQ('#cbcParity')}`, es: () => `Clasifica condiciones de frontera continuas: ${cdmQQ('#cbcParity')}`, hl: '#cbcParity' },
    { en: () => 'Raise N by one…', es: () => 'Sube N en uno…', button: '+',
      then: { en: () => `N = ${cdmQT('#cbcN')}. «${cdmEsc(cdmFind('#cbcUnbroken', /unbroken group depends/).replace(/^.*?(?=the unbroken group depends)/, ''))}»`, es: () => `N = ${cdmQT('#cbcN')}. «${cdmEsc(cdmFind('#cbcUnbroken', /unbroken group depends/).replace(/^.*?(?=the unbroken group depends)/, ''))}»`, hl: '#cbcUnbroken' } },
    { en: () => cdmQQ('#cbcHonesty'), es: () => cdmQQ('#cbcHonesty'), hl: '#cbcHonesty' },
  ]),
  blkt: cdmSec([
    { en: () => `Brane kinetic terms: how a brane term moves the spectrum. ${cdmQQ('#bkStep1')}`, es: () => `Términos cinéticos de brana: cómo un término de brana mueve el espectro. ${cdmQQ('#bkStep1')}`, hl: '#bkStep1' },
    { en: () => 'Raise the brane coefficient c to 12…', es: () => 'Sube el coeficiente de brana c a 12…', set: ['#bkC', 12],
      then: { en: () => cdmQQ('#bkEqNote'), es: () => cdmQQ('#bkEqNote'), hl: '#section canvas' } },
    { en: () => `The check: ${cdmQQ('#bkJoinV')}`, es: () => `La comprobación: ${cdmQQ('#bkJoinV')}`, hl: '#bkJoinV' },
    { en: () => cdmQQ('#bkScaleNote'), es: () => cdmQQ('#bkScaleNote'), hl: '#bkScaleNote' },
  ]),
  gravitygauge: cdmSec([
    { en: () => `Gravity–gauge · 3D: the same tower, different responses. ${cdmQQ('#ggInputNote')}`, es: () => `Gravedad–gauge · 3D: la misma torre, respuestas distintas. ${cdmQQ('#ggInputNote')}`, hl: '#ggInputNote' },
    { en: () => 'Set η = −0.9…', es: () => 'Pon η = −0,9…', click: '#ggMinus' },
    { en: () => '…and show the gauge kinetic function Z(t)', es: () => '…y muestra la función cinética gauge Z(t)', set: ['#ggQuantity', 'kinetic'],
      then: { en: () => cdmQQ('#ggSurfaceNote', 2), es: () => cdmQQ('#ggSurfaceNote', 2), hl: '#section canvas' } },
    { en: () => cdmQQ('#ggRealization'), es: () => cdmQQ('#ggRealization'), hl: '#ggRealization' },
  ]),
  litcensus: cdmSec([
    { en: () => `Literature census: ${cdmQQ('#ltCorpusNote')}`, es: () => `Censo de la literatura: ${cdmQQ('#ltCorpusNote')}`, hl: '#ltCorpusNote' },
    { en: () => 'Show only the papers with the complete triple…', es: () => 'Muestra solo los artículos con la tripleta completa…', set: ['#ltOnly', 'triple'],
      then: { en: () => cdmQQ('#ltRowsNote', 2), es: () => cdmQQ('#ltRowsNote', 2), hl: '#ltRowsNote' } },
    { en: () => cdmQQ('#ltUnread'), es: () => cdmQQ('#ltUnread'), hl: '#ltUnread' },
  ]),
});
