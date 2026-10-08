# Extends the laboratory's pinned PhaseTracer environment without changing it.
FROM ghu-lab-scientific:20261006
COPY crossvalidation-requirements.txt /tmp/crossvalidation-requirements.txt
RUN python -m pip install --no-cache-dir --no-deps --only-binary=:all: --require-hashes -r /tmp/crossvalidation-requirements.txt
WORKDIR /work
