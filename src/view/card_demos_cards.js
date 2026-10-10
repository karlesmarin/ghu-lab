/* card_demos_cards.js — the hand-written 🎬 demos of the experiment cards (run by card_demo.js).
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * One script per card, written for what that card answers.  Every banner is a function of the card's result at that
 * moment (`v`), so a number on screen is the number the card computed; where a step's outcome could go either way the
 * wording is chosen from the value, never assumed.  Scripts only: the engine, the actions and the checks are in
 * card_demo.js, and build/demos.mjs runs every script in a browser.
 */
const cdmR = (panel, id) => () => rxResult(panel(), RX_STATE[id]);   // panel is a thunk: sections load after views
const cdmPre = mode => [{ kind: 'set', selector: '#prModel', value: mode }];
const cdmOutside = v => v.comparison.filter(c => !c.inside).length;

Object.assign(CDM_DEMOS, {
  su6mn: {
    model: cdmR(() => MN_PANEL, 'su6mn'),
    steps: [
      { en: () => 'Maru–Nago SU(6): does a Type 2 / Type 3 fermion content select a small Wilson phase — and is that minimum numerically stable?',
        es: () => 'SU(6) de Maru–Nago: ¿selecciona un contenido de fermiones de Tipo 2 / Tipo 3 una fase de Wilson pequeña, y es estable ese mínimo?',
        hl: '#rx_su6mn h2' },
      { en: v => `Three Type 3 generations and ${v.parameters.Nad} adjoint copies: the minimum is α = ${cdmNum(v.minimum.alpha, 5)}. Table 2 of the paper prints ${v.published ? v.published.alpha : '—'}; an independent infinite sum gives ${v.published ? cdmNum(v.published.infiniteAlpha, 5) : '—'}.`,
        es: v => `Tres generaciones de Tipo 3 y ${v.parameters.Nad} copias adjuntas: el mínimo está en α = ${cdmNum(v.minimum.alpha, 5)}. La tabla 2 del artículo da ${v.published ? v.published.alpha : '—'}; una suma infinita independiente da ${v.published ? cdmNum(v.published.infiniteAlpha, 5) : '—'}.`,
        hl: '#rx_su6mn_result > p' },
      { en: () => 'The whole Wilson potential: the vacuum is the lowest point, close to the origin', es: () => 'El potencial de Wilson completo: el vacío es el punto más bajo, cerca del origen', fig: 0 },
      { en: () => 'Now cut the Fourier sum to 10 terms…', es: () => 'Corta ahora la suma de Fourier a 10 términos…',
        set: ['#rx_su6mn_controls [data-rx="windings"]', 10],
        then: { en: v => `…the minimum moves to α = ${cdmNum(v.minimum.alpha, 5)}${v.published && Math.abs(v.minimum.alpha - Number(v.published.alpha)) < 5e-5 ? ', the value printed in Table 2' : ''}; with 1000 terms it is ${cdmNum(v.convergence.at(-1).alpha, 5)}. The card does not claim how the table was made — it shows that convergence matters.`,
                es: v => `…el mínimo pasa a α = ${cdmNum(v.minimum.alpha, 5)}${v.published && Math.abs(v.minimum.alpha - Number(v.published.alpha)) < 5e-5 ? ', el valor impreso en la tabla 2' : ''}; con 1000 términos es ${cdmNum(v.convergence.at(-1).alpha, 5)}. La tarjeta no afirma cómo se hizo la tabla: muestra que la convergencia importa.`, hl: '#rx_su6mn_result svg', index: 1 } },
      { en: () => 'Back to 240 terms, and remove the adjoint fermions…', es: () => 'Vuelve a 240 términos y quita los fermiones adjuntos…',
        set: ['#rx_su6mn_controls [data-rx="windings"]', 240] },
      { en: () => 'Adjoint Dirac copies → 0', es: () => 'Copias adjuntas de Dirac → 0',
        set: ['#rx_su6mn_controls [data-rx="Nad"]', 0],
        then: { en: v => v.minimum.alpha > 0 && v.minimum.alpha < 1 ? `The minimum is now α = ${cdmNum(v.minimum.alpha, 5)}.` : `Without them the preferred vacuum goes to the endpoint α = ${cdmNum(v.minimum.alpha, 3)}: this content selects no interior phase. The adjoints are what make the small Wilson phase.`,
                es: v => v.minimum.alpha > 0 && v.minimum.alpha < 1 ? `El mínimo está ahora en α = ${cdmNum(v.minimum.alpha, 5)}.` : `Sin ellos el vacío preferido se va al extremo α = ${cdmNum(v.minimum.alpha, 3)}: este contenido no selecciona ninguna fase interior. Los adjuntos son los que producen la fase de Wilson pequeña.`, hl: '#rx_su6mn_result svg', index: 0 } },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>Minimum α</b> is the Wilson-line phase the bulk content prefers; a small interior α is what electroweak breaking needs.', '<b>Convergence</b>: read the table of Fourier terms before quoting a digit — the published value and the converged one differ in the third significant figure.', '<b>Load into the SU(N) builder</b> transfers the bulk potential only; brane terms that lift adjoint zero modes need more input.', '👉 <b>Now try it:</b> change k₃ (Type 2 vs Type 3) or the number of adjoint copies and watch where the minimum goes.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>El mínimo α</b> es la fase de la línea de Wilson que prefiere el contenido del bulk; una α interior pequeña es lo que necesita la ruptura electrodébil.', '<b>Convergencia</b>: lee la tabla de términos de Fourier antes de citar una cifra; el valor publicado y el convergido difieren en la tercera cifra.', '<b>Cargar en el constructor SU(N)</b> transfiere solo el potencial del bulk; los términos de brana que levantan los modos cero adjuntos necesitan más datos.', '👉 <b>Pruébalo:</b> cambia k₃ (Tipo 2 frente a Tipo 3) o el número de copias adjuntas y mira dónde va el mínimo.'] },
    },
  },

  rsrunning: {
    model: cdmR(() => RU_PANEL, 'rsrunning'),
    steps: [
      { en: () => 'Warped SU(6): how large must the UV brane terms be to reconcile the two independent gauge-coupling differences?',
        es: () => 'SU(6) curvado: ¿qué tamaño deben tener los términos de brana UV para reconciliar las dos diferencias independientes de acoplos gauge?',
        hl: '#rx_rsrunning h2' },
      { en: v => `Assignment C${v.parameters.content}: the UV brane terms must differ by Δλ₂₁ = ${cdmNum(v.requiredDeltaLambda[0], 3)} and Δλ₃₁ = ${cdmNum(v.requiredDeltaLambda[1], 3)} — ${cdmNum(v.maxRequired / v.nda, 0)} times the naive-dimensional-analysis size 1/(16π²).`,
        es: v => `Asignación C${v.parameters.content}: los términos de brana UV deben diferir en Δλ₂₁ = ${cdmNum(v.requiredDeltaLambda[0], 3)} y Δλ₃₁ = ${cdmNum(v.requiredDeltaLambda[1], 3)}: ${cdmNum(v.maxRequired / v.nda, 0)} veces el tamaño de análisis dimensional ingenuo 1/(16π²).`,
        hl: '#rx_rsrunning_result > p' },
      { en: () => 'The two inverse-coupling differences run with log q; the brane terms are what closes them at the UV scale', es: () => 'Las dos diferencias de acoplos inversos corren con log q; los términos de brana son los que las cierran en la escala UV', fig: 0 },
      { en: () => 'Switch to the C2 matter assignment…', es: () => 'Cambia a la asignación de materia C2…',
        set: ['#rx_rsrunning_controls [data-rx="content"]', 2],
        then: { en: v => `C2 needs Δλ₂₁ = ${cdmNum(v.requiredDeltaLambda[0], 3)} and Δλ₃₁ = ${cdmNum(v.requiredDeltaLambda[1], 3)}: ${cdmNum(v.maxRequired / v.nda, 0)}× NDA. The matter content changes how much the boundary has to do.`,
                es: v => `C2 necesita Δλ₂₁ = ${cdmNum(v.requiredDeltaLambda[0], 3)} y Δλ₃₁ = ${cdmNum(v.requiredDeltaLambda[1], 3)}: ${cdmNum(v.maxRequired / v.nda, 0)}× NDA. El contenido de materia cambia cuánto tiene que hacer la frontera.` } },
      { en: () => 'Now enter the required Δλ₂₁ as your own choice…', es: () => 'Introduce ahora el Δλ₂₁ requerido como tu elección…',
        set: ['#rx_rsrunning_controls [data-rx="lambda21"]', v => Number(v.requiredDeltaLambda[0].toFixed(3))],
        then: { en: v => `…and its residual in the table drops to ${cdmNum(v.residual[0], 4)}. Residuals test your chosen boundary terms against the required ones; they are not a statistical fit.`,
                es: v => `…y su residuo en la tabla baja a ${cdmNum(v.residual[0], 4)}. Los residuos comparan tus términos de frontera con los requeridos; no son un ajuste estadístico.`, hl: '#rx_rsrunning_result table' } },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>Required Δλ</b> are the UV brane-term differences that make the two coupling differences match at the UV scale, given the matter assignment and the IR/UV scales.', '<b>× NDA</b> compares them with 1/(16π²): a large ratio means the boundary carries most of the unification.', '<b>Residuals</b> compare your chosen Δλ with the required ones — a consistency check, not a goodness of fit.', '👉 <b>Now try it:</b> move the IR scale or the UV scale and see how much the required brane terms change.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>Los Δλ requeridos</b> son las diferencias de términos de brana UV que hacen coincidir las dos diferencias de acoplos en la escala UV, dada la asignación de materia y las escalas IR/UV.', '<b>× NDA</b> las compara con 1/(16π²): un cociente grande significa que la frontera hace la mayor parte de la unificación.', '<b>Los residuos</b> comparan tus Δλ con los requeridos: una comprobación de consistencia, no una bondad de ajuste.', '👉 <b>Pruébalo:</b> mueve la escala IR o la UV y mira cuánto cambian los términos de brana requeridos.'] },
    },
  },

  flavour: {
    pre: cdmPre('neutrino'),
    model: cdmR(() => NF_PANEL, 'flavour'),
    steps: [
      { en: () => 'Three active flavours: can three independent ring copies realize chosen neutrino masses and the PMNS orientation?',
        es: () => 'Tres sabores activos: ¿pueden tres copias independientes del anillo realizar unas masas de neutrinos y una orientación PMNS elegidas?',
        hl: '#rx_flavour h2' },
      { en: () => 'Load the NuFIT 6.1 normal-ordering inputs', es: () => 'Carga los datos de NuFIT 6.1 con ordenación normal', button: 'NuFIT 6.1 · normal',
        then: { en: v => `Rank ${v.rank}: masses ${v.massesEV.map(x => cdmNum(x, 4)).join(', ')} eV, Σm = ${cdmNum(v.sumMassEV, 4)} eV, mββ = ${cdmNum(v.mBBEV, 4)} eV, J_CP = ${cdmNum(v.jarlskog, 4)}. These are inputs reconstructed, not predictions of the ring.`,
                es: v => `Rango ${v.rank}: masas ${v.massesEV.map(x => cdmNum(x, 4)).join(', ')} eV, Σm = ${cdmNum(v.sumMassEV, 4)} eV, mββ = ${cdmNum(v.mBBEV, 4)} eV, J_CP = ${cdmNum(v.jarlskog, 4)}. Son datos reconstruidos, no predicciones del anillo.` } },
      { en: () => 'νμ → νe and its antineutrino version in vacuum: where they differ, that is CP violation', es: () => 'νμ → νe y su versión de antineutrinos en vacío: donde difieren, eso es violación de CP', fig: 0 },
      { en: () => 'Now the inverted ordering', es: () => 'Ahora la ordenación invertida', button: 'NuFIT 6.1 · inverted',
        then: { en: v => `Inverted: Σm = ${cdmNum(v.sumMassEV, 4)} eV and mββ = ${cdmNum(v.mBBEV, 4)} eV — the ordering shows most in mββ, the neutrinoless double-beta quantity.`,
                es: v => `Invertida: Σm = ${cdmNum(v.sumMassEV, 4)} eV y mββ = ${cdmNum(v.mBBEV, 4)} eV; la ordenación se nota sobre todo en mββ, la magnitud de la doble beta sin neutrinos.` } },
      { en: () => 'Back to normal ordering…', es: () => 'Vuelve a la ordenación normal…', button: 'NuFIT 6.1 · normal' },
      { en: () => 'Set the Dirac phase δ to 90°…', es: () => 'Pon la fase de Dirac δ en 90°…',
        set: ['#rx_flavour_controls [data-rx="delta"]', 90],
        then: { en: v => `J_CP is now ${cdmNum(v.jarlskog, 4)}${v.jarlskog > 0 ? ' — the sign has flipped' : ''}, and ${cdmOutside(v)} input${cdmOutside(v) === 1 ? '' : 's'} now lie outside the separate NuFIT 3σ ranges (see the comparison table). Separate ranges are not a combined fit.`,
                es: v => `J_CP vale ahora ${cdmNum(v.jarlskog, 4)}${v.jarlskog > 0 ? ': el signo ha cambiado' : ''}, y ${cdmOutside(v)} dato${cdmOutside(v) === 1 ? '' : 's'} quedan fuera de los rangos 3σ separados de NuFIT (mira la tabla de comparación). Los rangos separados no son un ajuste combinado.`, hl: '#rx_flavour_result svg', index: 0 } },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>Rank</b> is the number of independent light-mass directions the three ring copies realize.', '<b>Σm, mβ, mββ, J_CP</b> follow from the masses and the PMNS orientation you chose; they are reconstructions, not ring predictions.', '<b>The comparison table</b> checks each input against its own NuFIT 3σ range; adding those ranges would not be a likelihood.', '👉 <b>Now try it:</b> raise the lightest mass and watch Σm and mββ grow.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>El rango</b> es el número de direcciones de masa ligera independientes que realizan las tres copias del anillo.', '<b>Σm, mβ, mββ, J_CP</b> salen de las masas y la orientación PMNS que elegiste; son reconstrucciones, no predicciones del anillo.', '<b>La tabla de comparación</b> mira cada dato frente a su propio rango 3σ de NuFIT; sumar esos rangos no sería una verosimilitud.', '👉 <b>Pruébalo:</b> sube la masa más ligera y mira cómo crecen Σm y mββ.'] },
    },
  },

  identifiability: {
    pre: cdmPre('neutrino'),
    model: cdmR(() => NI_PANEL, 'identifiability'),
    steps: [
      { en: () => 'Fixed light inputs: which ring parameters can change with the same light masses and mixing — and what would tell them apart?',
        es: () => 'Entradas ligeras fijas: ¿qué parámetros del anillo pueden cambiar con las mismas masas ligeras y mezcla, y qué los distinguiría?',
        hl: '#rx_identifiability h2' },
      { en: () => 'First path: change the heavy-pair splitting', es: () => 'Primer camino: cambia el desdoblamiento del par pesado', button: 'Heavy splitting at fixed light inputs',
        then: { en: v => `The light masses and mixing stay fixed (residual ${cdmNum(v.summary.maxLightResidualEV, 1)} eV) while the heavy pair moves: centre ${cdmNum(v.selected?.massGeV, 1)} GeV, splitting ${cdmNum(v.selected?.splitEV, 1)} eV. Oscillations alone cannot see it.`,
                es: v => `Las masas ligeras y la mezcla siguen fijas (residuo ${cdmNum(v.summary.maxLightResidualEV, 1)} eV) mientras el par pesado se mueve: centro ${cdmNum(v.selected?.massGeV, 1)} GeV, desdoblamiento ${cdmNum(v.selected?.splitEV, 1)} eV. Las oscilaciones por sí solas no lo ven.`, hl: '#rx_identifiability_result .ni-fixed' } },
      { en: () => 'The sweep: the heavy spectrum changes along the path while the light sector does not', es: () => 'El barrido: el espectro pesado cambia a lo largo del camino y el sector ligero no', hl: '#rx_identifiability_result .ni-figure', index: 0 },
      { en: () => 'Second path: a common suppression of all three flavours', es: () => 'Segundo camino: una supresión común de los tres sabores', button: 'Common suppression hidden by normalization',
        then: { en: v => `Equal deficits scale the raw current by (1−d)²; the normalized factor cancels that exactly (largest shape difference ${cdmNum(v.selected?.maxShapeDifference, 1)}). An absolute rate would need a detector analysis.`,
                es: v => `Déficits iguales escalan la corriente bruta por (1−d)²; el factor normalizado lo cancela exactamente (mayor diferencia de forma ${cdmNum(v.selected?.maxShapeDifference, 1)}). Una tasa absoluta necesitaría un análisis de detector.`, hl: '#rx_identifiability_result .ni-figure', index: 0 } },
      { en: () => 'Third path: unequal deficits between flavours', es: () => 'Tercer camino: déficits distintos entre sabores', button: 'Unequal deficits and flavour shape',
        then: { en: v => `Now the normalized flavour shape does change (largest difference ${cdmNum(v.selected?.maxShapeDifference, 2)}): this is what a fit allowing non-unitarity could test.`,
                es: v => `Ahora la forma normalizada por sabor sí cambia (mayor diferencia ${cdmNum(v.selected?.maxShapeDifference, 2)}): esto es lo que podría poner a prueba un ajuste que admita no unitariedad.`, hl: '#rx_identifiability_result .ni-figure', index: 1 } },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>Fixed light inputs</b>: every point of the sweep reproduces the same light masses and PMNS orientation (see the residual).', '<b>Heavy centre and splitting</b> can move without any trace in oscillations; telling them apart needs lepton-number-sensitive observables.', '<b>Shape differences</b> appear only for unequal deficits; the DeepCore map below is a standard three-neutrino reference, not a ring likelihood.', '👉 <b>Now try it:</b> pick another parameter to investigate and move the position along the sweep.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>Entradas ligeras fijas</b>: cada punto del barrido reproduce las mismas masas ligeras y la misma orientación PMNS (mira el residuo).', '<b>El centro y el desdoblamiento pesados</b> pueden moverse sin dejar rastro en las oscilaciones; distinguirlos necesita observables sensibles al número leptónico.', '<b>Las diferencias de forma</b> solo aparecen con déficits distintos; el mapa de DeepCore de abajo es una referencia estándar de tres neutrinos, no una verosimilitud del anillo.', '👉 <b>Pruébalo:</b> elige otro parámetro para investigar y mueve la posición a lo largo del barrido.'] },
    },
  },

  thermal: {
    pre: cdmPre('builder'),
    model: cdmR(() => TH_PANEL, 'thermal'),
    steps: [
      { en: () => 'Finite-temperature GHU: does the thermal Wilson vacuum change, and does a real bubble calculation support nucleation?',
        es: () => 'GHU a temperatura finita: ¿cambia el vacío de Wilson térmico, y respalda la nucleación un cálculo real de burbujas?',
        hl: '#rx_thermal h2' },
      { en: () => 'Load case 1 of Hirose–Shibuya', es: () => 'Carga el caso 1 de Hirose–Shibuya', button: 'Thermal paper · case 1',
        then: { en: v => `Case 1: the two phases coexist at Tc = ${cdmNum(v.critical?.temperatureGeV, 1)} GeV; the matching PhaseTracer bounce gives a nucleation proxy at Tn = ${cdmNum(v.externalResult?.nucleation?.temperatureGeV, 1)} GeV.`,
                es: v => `Caso 1: las dos fases coexisten a Tc = ${cdmNum(v.critical?.temperatureGeV, 1)} GeV; el rebote de PhaseTracer correspondiente da una estimación de nucleación a Tn = ${cdmNum(v.externalResult?.nucleation?.temperatureGeV, 1)} GeV.` } },
      { en: () => 'The thermal potential, with the doubled-cutoff curve on top: where they overlap, the truncation is not the story', es: () => 'El potencial térmico, con la curva de cortes doblados encima: donde coinciden, el truncamiento no es lo que importa', fig: 0 },
      { en: () => 'How the preferred Wilson phase moves as the temperature R T changes', es: () => 'Cómo se mueve la fase de Wilson preferida al cambiar la temperatura R T', fig: 1 },
      { en: () => 'Now case 2', es: () => 'Ahora el caso 2', button: 'Thermal paper · case 2',
        then: { en: v => `Case 2: preferred α = ${cdmNum(v.minima[0]?.a, 4)}, coexistence at Tc = ${cdmNum(v.critical?.temperatureGeV, 2)} GeV, nucleation proxy ${cdmNum(v.externalResult?.nucleation?.temperatureGeV, 2)} GeV — very close to Tc, which is why this case is precision-sensitive.`,
                es: v => `Caso 2: α preferida = ${cdmNum(v.minima[0]?.a, 4)}, coexistencia a Tc = ${cdmNum(v.critical?.temperatureGeV, 2)} GeV, estimación de nucleación ${cdmNum(v.externalResult?.nucleation?.temperatureGeV, 2)} GeV: muy cerca de Tc, por eso este caso es sensible a la precisión.` } },
      { en: () => 'Change the gauge coupling g₄ to 1.1…', es: () => 'Cambia el acoplo gauge g₄ a 1,1…',
        set: ['#rx_thermal_controls [data-rx="g4"]', 1.1],
        then: { en: v => v.externalResult ? `The PhaseTracer result still matches.` : 'The stored PhaseTracer result no longer matches these inputs, so it is withdrawn: the card will not show a nucleation temperature it did not compute for this point.',
                es: v => v.externalResult ? 'El resultado de PhaseTracer sigue coincidiendo.' : 'El resultado de PhaseTracer guardado ya no corresponde a estas entradas, así que se retira: la tarjeta no muestra una temperatura de nucleación que no calculó para este punto.' } },
      { en: () => 'Restore case 2', es: () => 'Restaura el caso 2', button: 'Thermal paper · case 2' },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>Tc</b> is where the symmetric and broken Wilson phases are degenerate — a coexistence candidate, not yet a transition.', '<b>Tn</b> needs an actual bounce calculation (PhaseTracer) for the same inputs; change an input and the stored result is withdrawn.', '<b>Doubled cutoffs</b> show how much of the curve is truncation.', '👉 <b>Now try it:</b> change the matter content and read Tc; the history card below follows bubbles through percolation.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>Tc</b> es donde las fases de Wilson simétrica y rota están degeneradas: un candidato de coexistencia, aún no una transición.', '<b>Tn</b> necesita un cálculo real del rebote (PhaseTracer) para las mismas entradas; cambia una entrada y el resultado guardado se retira.', '<b>Los cortes doblados</b> muestran cuánto de la curva es truncamiento.', '👉 <b>Pruébalo:</b> cambia el contenido de materia y lee Tc; la tarjeta de historia de abajo sigue las burbujas hasta la percolación.'] },
    },
  },

  thermalhistory: {
    pre: [...cdmPre('builder'), { kind: 'button', text: 'Thermal paper · case 1' }],
    model: cdmR(() => TH_HISTORY_PANEL, 'thermalhistory'),
    steps: [
      { en: () => 'Integrated thermal history: do nucleated bubbles percolate and complete the transition, under a stated expansion and wall speed?',
        es: () => 'Historia térmica integrada: ¿percolan las burbujas nucleadas y completan la transición, con una expansión y una velocidad de pared declaradas?',
        hl: '#rx_thermalhistory h2' },
      { en: v => v.history ? `${v.status === 'conditional-completion' ? 'The transition completes' : 'Completion is not established'}: integrated nucleation at ${cdmNum(v.history.nucleation?.temperatureGeV, 2)} GeV, percolation at ${cdmNum(v.history.percolation?.temperatureGeV, 2)} GeV (case 1 of the thermal card above).` : 'The refined action table for these inputs is pending.',
        es: v => v.history ? `${v.status === 'conditional-completion' ? 'La transición se completa' : 'No se establece la compleción'}: nucleación integrada a ${cdmNum(v.history.nucleation?.temperatureGeV, 2)} GeV, percolación a ${cdmNum(v.history.percolation?.temperatureGeV, 2)} GeV (caso 1 de la tarjeta térmica de arriba).` : 'La tabla de acciones refinada para estas entradas está pendiente.',
        hl: '#rx_thermalhistory_result > p' },
      { en: () => 'The false-vacuum fraction as the universe cools (to the left): percolation and completion are thresholds on this curve', es: () => 'La fracción de falso vacío al enfriarse el universo (hacia la izquierda): la percolación y la compleción son umbrales sobre esta curva', fig: 0 },
      { en: v => v.spectrum ? `The conditional acoustic gravitational-wave spectrum: peak ${cdmNum(v.spectrum.fPeakHz * 1000, 2)} mHz, Ω h² = ${v.spectrum.peakOmegaH2.toExponential(2)} — conditional on the wall speed and fluid efficiency you assume.` : 'The acoustic spectrum is not evaluated for these assumptions.',
        es: v => v.spectrum ? `El espectro acústico condicional de ondas gravitacionales: pico ${cdmNum(v.spectrum.fPeakHz * 1000, 2)} mHz, Ω h² = ${v.spectrum.peakOmegaH2.toExponential(2)}, condicionado a la velocidad de pared y la eficiencia del fluido que supongas.` : 'El espectro acústico no se evalúa con estas hipótesis.',
        fig: 1 },
      { en: () => 'Slow the walls to 0.8 c…', es: () => 'Frena las paredes a 0,8 c…',
        set: ['#rx_thermalhistory_controls [data-rx="wallSpeed"]', 0.8],
        then: { en: v => `Percolation moves to ${cdmNum(v.history?.percolation?.temperatureGeV, 2)} GeV — the history depends on the assumption, and the card says so.`, es: v => `La percolación pasa a ${cdmNum(v.history?.percolation?.temperatureGeV, 2)} GeV: la historia depende de la hipótesis, y la tarjeta lo dice.` } },
      { en: () => 'Lower the fluid efficiency κ to 0.1…', es: () => 'Baja la eficiencia del fluido κ a 0,1…',
        set: ['#rx_thermalhistory_controls [data-rx="efficiency"]', 0.1],
        then: { en: v => v.spectrum ? `The acoustic peak becomes Ω h² = ${v.spectrum.peakOmegaH2.toExponential(2)}.` : `The acoustic spectrum is no longer evaluated: ${v.acousticDomain?.reason || 'outside its domain'}. Bubble history and signal are separate questions.`,
                es: v => v.spectrum ? `El pico acústico pasa a Ω h² = ${v.spectrum.peakOmegaH2.toExponential(2)}.` : `El espectro acústico deja de evaluarse: ${v.acousticDomain?.reason || 'fuera de su dominio'}. La historia de las burbujas y la señal son preguntas distintas.` } },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>Nucleation, percolation, completion</b> are three different temperatures: percolation is I = 0.34, completion a false fraction of 1%.', '<b>Wall speed and efficiency</b> are assumptions you supply; the acoustic spectrum is conditional on them.', 'These are the flat SU(3) thermal benchmarks, not a joint fit of the SU(7) candidate.', '👉 <b>Now try it:</b> switch the expansion background and see how the history moves.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>Nucleación, percolación y compleción</b> son tres temperaturas distintas: la percolación es I = 0,34 y la compleción una fracción falsa del 1 %.', '<b>La velocidad de pared y la eficiencia</b> son hipótesis que tú das; el espectro acústico está condicionado a ellas.', 'Son los benchmarks térmicos de SU(3) plana, no un ajuste conjunto del candidato SU(7).', '👉 <b>Pruébalo:</b> cambia el fondo de expansión y mira cómo se mueve la historia.'] },
    },
  },

  rsanomaly: {
    model: cdmR(() => RA_PANEL, 'rsanomaly'),
    steps: [
      { en: () => 'RS anomaly flow: does the chosen matter cancel the gauge anomalies while keeping the baryon-current anomaly?',
        es: () => 'Flujo de anomalías RS: ¿cancela la materia elegida las anomalías gauge manteniendo la anomalía de la corriente bariónica?',
        hl: '#rx_rsanomaly h2' },
      { en: v => `Z zero mode at ${cdmNum(v.selected.massGeV, 2)} GeV: anomaly factor F¹Z = ${cdmNum(v.selected.F1, 4)}; with three complete generations the γγZ gauge factor is ${cdmNum(v.gaugeGammaGammaZ, 4)}.`,
        es: v => `Modo cero del Z a ${cdmNum(v.selected.massGeV, 2)} GeV: factor de anomalía F¹Z = ${cdmNum(v.selected.F1, 4)}; con tres generaciones completas el factor gauge γγZ es ${cdmNum(v.gaugeGammaGammaZ, 4)}.`,
        hl: '#rx_rsanomaly_result > p' },
      { en: () => 'The anomaly flows between the UV and IR boundaries as the Wilson angle θH changes; their sum is what couples', es: () => 'La anomalía fluye entre las fronteras UV e IR al cambiar el ángulo de Wilson θH; lo que acopla es su suma', fig: 0 },
      { en: () => 'Select the first excited Z…', es: () => 'Selecciona el primer Z excitado…',
        set: ['#rx_rsanomaly_controls [data-rx="mode"]', 1],
        then: { en: v => `First KK Z at ${cdmNum(v.selected.massGeV / 1000, 2)} TeV: F¹Z = ${cdmNum(v.selected.F1, 3)}. The gauge factor stays ${cdmNum(v.gaugeGammaGammaZ, 4)}: cancellation is a property of the matter, not of the mode.`,
                es: v => `Primer Z de KK a ${cdmNum(v.selected.massGeV / 1000, 2)} TeV: F¹Z = ${cdmNum(v.selected.F1, 3)}. El factor gauge sigue en ${cdmNum(v.gaugeGammaGammaZ, 4)}: la cancelación es propiedad de la materia, no del modo.` } },
      { en: () => 'Now remove the leptons, keeping three quark generations…', es: () => 'Quita ahora los leptones y deja tres generaciones de quarks…',
        set: ['#rx_rsanomaly_controls [data-rx="leptonGen"]', 0],
        then: { en: v => v.groups.Q2T3 === 0 ? 'The gauge factors still cancel.' : `The γγZ gauge factor becomes ${cdmNum(v.gaugeGammaGammaZ, 3)}: an incomplete generation leaves a gauge anomaly. The baryon boundary factor stays ${cdmNum(v.baryon.normalizedBoundaryCoefficient, 5)} — a separate quantity.`,
                es: v => v.groups.Q2T3 === 0 ? 'Los factores gauge siguen cancelándose.' : `El factor gauge γγZ pasa a ${cdmNum(v.gaugeGammaGammaZ, 3)}: una generación incompleta deja una anomalía gauge. El factor bariónico de frontera sigue en ${cdmNum(v.baryon.normalizedBoundaryCoefficient, 5)}: es otra magnitud.` } },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>F¹Z</b> is the anomaly factor of the selected Z mode, from normalized wavefunctions at the UV and IR boundaries.', '<b>Gauge factors</b> cancel only for complete quark + lepton generations; an imbalance needs completion.', '<b>The baryon boundary factor</b> survives the gauge cancellation; it does not by itself give a proton lifetime or a baryogenesis yield.', '👉 <b>Now try it:</b> move θH or the warp factor log₁₀ zL and follow the UV/IR split.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>F¹Z</b> es el factor de anomalía del modo Z elegido, a partir de funciones de onda normalizadas en las fronteras UV e IR.', '<b>Los factores gauge</b> solo se cancelan con generaciones completas de quarks y leptones; un desequilibrio necesita completarse.', '<b>El factor bariónico de frontera</b> sobrevive a la cancelación gauge; por sí solo no da una vida media del protón ni un rendimiento de bariogénesis.', '👉 <b>Pruébalo:</b> mueve θH o el factor de curvatura log₁₀ zL y sigue el reparto UV/IR.'] },
    },
  },

  higgstools: {
    model: cdmR(() => HT_PANEL, 'higgstools'),
    steps: [
      { en: () => 'Higgs rates, total width and experimental tests: what do assumed GHU Higgs couplings imply, and do they survive HiggsBounds and HiggsSignals?',
        es: () => 'Tasas del Higgs, anchura total y contrastes experimentales: ¿qué implican unos acoplos del Higgs de GHU supuestos, y sobreviven a HiggsBounds y HiggsSignals?',
        hl: '#rx_higgstools h2' },
      { en: () => 'Start from the Standard Model reference', es: () => 'Empieza por la referencia del Modelo Estándar', button: 'SM reference',
        then: { en: v => `SM: total width ${cdmNum(v.widthGeV * 1000, 3)} MeV. The stored HiggsTools run matches these couplings: ${v.externalResult ? (v.externalResult.bounds.allowed ? 'not excluded by HiggsBounds' : 'excluded by HiggsBounds') + `, HiggsSignals Δχ² = ${cdmNum(v.externalResult.signals?.deltaChisq, 2)}` : 'no matching run'}.`,
                es: v => `SM: anchura total ${cdmNum(v.widthGeV * 1000, 3)} MeV. La ejecución guardada de HiggsTools corresponde a estos acoplos: ${v.externalResult ? (v.externalResult.bounds.allowed ? 'no excluido por HiggsBounds' : 'excluido por HiggsBounds') + `, Δχ² de HiggsSignals = ${cdmNum(v.externalResult.signals?.deltaChisq, 2)}` : 'ninguna ejecución correspondiente'}.` } },
      { en: () => 'Production cross sections at 8, 13, 13.6 and 14 TeV, mode by mode', es: () => 'Secciones eficaces de producción a 8, 13, 13,6 y 14 TeV, modo a modo', fig: 0 },
      { en: () => 'Now add a GHU top-quark Kaluza–Klein tower at MKK = 1.5 TeV in the gluon loop', es: () => 'Añade ahora una torre de Kaluza–Klein del top de GHU con MKK = 1,5 TeV en el lazo de gluones', button: 'GHU top tower · MKK = 1.5 TeV',
        then: { en: v => `κg = ${cdmNum(v.parameters.kg, 4)}: gluon fusion at 13 TeV drops to ${cdmNum(v.crossSectionsPb.LHC13.ggH, 2)} pb (κg² = ${cdmNum(v.parameters.kg ** 2, 3)}). ${v.externalResult ? '' : 'There is no HiggsTools run for these couplings, so the card shows no experimental verdict — it does not borrow the SM one.'}`,
                es: v => `κg = ${cdmNum(v.parameters.kg, 4)}: la fusión de gluones a 13 TeV baja a ${cdmNum(v.crossSectionsPb.LHC13.ggH, 2)} pb (κg² = ${cdmNum(v.parameters.kg ** 2, 3)}). ${v.externalResult ? '' : 'No hay ejecución de HiggsTools para estos acoplos, así que la tarjeta no da veredicto experimental: no toma prestado el del SM.'}`, hl: '#rx_higgstools_result svg', index: 0 } },
      { en: () => 'Back to the SM, and add 1 MeV of invisible width…', es: () => 'Vuelve al SM y añade 1 MeV de anchura invisible…', button: 'SM reference' },
      { en: () => 'Invisible width → 1 MeV', es: () => 'Anchura invisible → 1 MeV',
        set: ['#rx_higgstools_controls [data-rx="invWidthMeV"]', 1],
        then: { en: v => `Total width ${cdmNum(v.widthGeV * 1000, 3)} MeV, invisible branching fraction ${cdmNum(v.branching.directInv, 3)}: every visible rate is diluted by the same factor.`,
                es: v => `Anchura total ${cdmNum(v.widthGeV * 1000, 3)} MeV, fracción invisible ${cdmNum(v.branching.directInv, 3)}: todas las tasas visibles se diluyen por el mismo factor.` } },
    ],
    explain: {
      en: { title: '📊 How to read this card', lines: ['<b>κ factors</b> scale couplings relative to the SM; the gluon one may include a GHU top tower. All other couplings are explicit assumptions.', '<b>Total width and branching fractions</b> are computed locally from the pinned HiggsPredictions reference.', '<b>The experimental verdict</b> (HiggsBounds/HiggsSignals) is shown only for a matching HiggsTools run; run the local engine or import a result for new couplings.', '👉 <b>Now try it:</b> change κV or κF and watch the rates and the width.'] },
      es: { title: '📊 Cómo leer esta tarjeta', lines: ['<b>Los factores κ</b> escalan los acoplos respecto al SM; el de gluones puede incluir una torre del top de GHU. Los demás acoplos son hipótesis explícitas.', '<b>La anchura total y las fracciones de desintegración</b> se calculan localmente con la referencia fijada de HiggsPredictions.', '<b>El veredicto experimental</b> (HiggsBounds/HiggsSignals) solo se muestra para una ejecución de HiggsTools correspondiente; ejecuta el motor local o importa un resultado para acoplos nuevos.', '👉 <b>Pruébalo:</b> cambia κV o κF y mira las tasas y la anchura.'] },
    },
  },
});
