/* help.js — the explanation next to the term, instead of on another page.
 *
 * Copyright (c) 2026 Carles Marin. All rights reserved.
 * Author: Carles Marin <karlesmarin@gmail.com>  (with Claude, Anthropic, as assistant)
 *
 * WHY THIS EXISTS.  The hard words were already explained -- in `site/docs.html`, in the header of
 * every kernel file, in the prose above each panel.  All of it is somewhere else than where the
 * reader meets the word.  "Frobenius-Schur indicator" appears in a table column with no room for a
 * sentence, and a reader who does not already know what it is has to leave the instrument to find
 * out, which most people will simply not do.  So the sentence comes to the term.
 *
 * WHAT IT IS NOT.  It is not a tutorial and it is not a second telling of the section's prose.  An
 * entry is what you would say to a colleague who stopped you mid-sentence: the object, what it is
 * for, and the one thing about it that is easy to get wrong.  If an entry needs six sentences the
 * term probably deserves a paragraph in the section instead, and this is the wrong home for it.
 *
 * HONESTY, SAME RULE AS EVERYWHERE.  Where an entry states a result it says whose it is and where.
 * Where something is true only under a hypothesis, the hypothesis is IN the entry -- a definition
 * quoted without its precondition is how an inherited convention becomes a false claim.
 *
 * D3 SAYS THE KERNEL KNOWS NO DOM, so this is view: data plus one delegated listener.  Sections do
 * not wire anything; they call `helpMark(key)` where the word appears and that is the whole
 * contract.  An unknown key renders nothing rather than an empty bubble, because a mark that opens
 * onto nothing is worse than no mark.
 */

/* The glossary.  `term` is the heading, `body` is HTML and may use <code>, <b>, <i>. */
/*__GLOSSARY__*/

/* The mark, for a section to drop next to the word.  An unknown key renders NOTHING: a mark that
 * opens onto an empty bubble teaches the reader that the marks are not worth pressing. */
export function helpMark(key) {
  if (!HELP_TERMS[key]) return "";
  return '<button type="button" class="ihelp" data-help="' + key + '" aria-label="what is '
       + HELP_TERMS[key].term + '?" title="' + HELP_TERMS[key].term + '">i</button>';
}

/* Everything the marks need, wired once.  One delegated listener rather than one per mark, because
 * sections rebuild their markup on every refresh and per-element listeners would be re-attached
 * dozens of times a minute -- and the ones on the discarded nodes would leak.
 *
 * Guarded the same way the fibre panels are: the smoke harness renders sections in a stub document
 * in node, where `document.addEventListener` is not a function and a bare call is a ReferenceError
 * that takes the whole section down. */
export function mountHelp() {
  if (typeof document === "undefined" || typeof document.addEventListener !== "function") return;
  if (document.__helpMounted) return;
  document.__helpMounted = true;

  let pop = null, openFor = null;
  const close = () => { if (pop) { pop.remove(); } pop = null; openFor = null; };

  document.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest(".ihelp");
    if (!b) { if (pop && !ev.target.closest(".helppop")) close(); return; }
    ev.preventDefault();
    ev.stopPropagation();
    const spanish=typeof GUIDE_LANGUAGE!=='undefined'&&GUIDE_LANGUAGE==='es';
    const entry = (spanish?HELP_TERMS_ES:HELP_TERMS)[b.dataset.help];
    /* THE SAME MARK, not the same term.  One term can be marked twice on a page -- Frobenius-Schur
     * is marked at its heading and again at its column -- and keying this on the term made the
     * second mark close the first one's bubble instead of moving it to itself, which reads as a
     * mark that does not work. */
    const already = pop && openFor === b;
    close();
    if (!entry || already) return;                    /* pressing the same mark twice closes it */

    pop = document.createElement("div");
    pop.className = "helppop";
    pop.lang=spanish?"es":"en";
    openFor = b;
    pop.innerHTML = "<b>" + entry.term + "</b><p>" + entry.body + "</p>";
    if(typeof guideHref==='function'){const a=document.createElement('a');a.href=guideHref('glossary')+'#'+b.dataset.help;a.target='_blank';a.rel='noopener';a.textContent=spanish?'Abrir glosario ↗':'Open glossary ↗';pop.appendChild(a);}
    document.body.appendChild(pop);

    /* Anchored under the mark, then pulled back inside the viewport -- on a phone the mark is
     * often within a bubble's width of the right edge, and a popover that opens off-screen is a
     * popover that does not exist. */
    const r = b.getBoundingClientRect();
    const w = pop.offsetWidth, h = pop.offsetHeight;
    const vw = document.documentElement.clientWidth;
    let x = r.left + window.scrollX - w / 2 + r.width / 2;
    x = Math.max(8 + window.scrollX, Math.min(x, window.scrollX + vw - w - 8));
    const below = r.bottom + 8 + h < document.documentElement.clientHeight;
    pop.style.left = Math.round(x) + "px";
    pop.style.top = Math.round((below ? r.bottom + 8 : r.top - h - 8) + window.scrollY) + "px";
  });

  document.addEventListener("keydown", (ev) => { if (ev.key === "Escape") close(); });
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
  }
}

/* Exported for a section that wants to render the whole list -- and for the control that checks
 * every key a section asks for is a key that exists. */
export function helpTerms() { return HELP_TERMS; }
