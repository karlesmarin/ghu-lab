# Parton-luminosity engine for tools/make_parton_lumi.py (offline; output pinned in data/).
#   docker build -f tools/pdf.Dockerfile -t ghu-pdf:local tools
#   docker run --rm -v <repo>:/w -w /w ghu-pdf:local python tools/make_parton_lumi.py
# LHAPDF from conda-forge (6.5.6 at the time of writing); the PDF set is the one ATLAS used for its KK-gluon theory
# curve (arXiv:2512.17856: MadGraph LO with NNPDF2.3lo -> NNPDF23_lo_as_0130_qed, LHAPDF ID 247000 as read from LHAPDF; alpha_s(MZ) = 0.130).
FROM mambaorg/micromamba:1.5.10
RUN micromamba install -y -q -n base -c conda-forge lhapdf=6.5.6 python=3.11 numpy curl && micromamba clean -a -y
USER root
RUN mkdir -p /opt/lhapdf && chown mambauser /opt/lhapdf
USER mambauser
ENV LHAPDF_DATA_PATH=/opt/lhapdf
RUN micromamba run -n base bash -c "cd /opt/lhapdf && curl -sL https://lhapdfsets.web.cern.ch/current/NNPDF23_lo_as_0130_qed.tar.gz | tar xz && ls /opt/lhapdf"
ENTRYPOINT ["micromamba", "run", "-n", "base"]
