FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cmake git ca-certificates python3-dev python3-venv libalglib-dev libnlopt-cxx-dev libeigen3-dev libboost-filesystem-dev libboost-log-dev libgsl-dev
COPY PhaseTracer /opt/PhaseTracer
RUN cmake -S /opt/PhaseTracer -B /opt/PhaseTracer/build -DPHASETRACER_BUILD_EXAMPLES=OFF -DPHASETRACER_BUILD_TESTS=ON && cmake --build /opt/PhaseTracer/build -j2
COPY HiggsTools /opt/HiggsTools
ENV CMAKE_BUILD_PARALLEL_LEVEL=2
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir /opt/HiggsTools scipy matplotlib
ENV PATH="/opt/venv/bin:${PATH}"
COPY hbdataset /datasets/hb
COPY hsdataset /datasets/hs
COPY tools /opt/adapter
COPY tools/backend_versions.json /opt/ghu-tool-versions.json
RUN g++ -std=c++17 -O3 -DBOOST_LOG_DYN_LINK -I/opt/PhaseTracer/include -I/opt/PhaseTracer/EffectivePotential/include/effectivepotential -I/usr/include/eigen3 /opt/adapter/thermal_bounce.cpp -o /opt/adapter/thermal_bounce -L/opt/PhaseTracer/lib -L/opt/PhaseTracer/EffectivePotential/lib -lphasetracer -leffectivepotential -lalglib -lnlopt -lboost_log -lboost_filesystem -lboost_system -Wl,-rpath,/opt/PhaseTracer/lib:/opt/PhaseTracer/EffectivePotential/lib
WORKDIR /opt/adapter
EXPOSE 8790
CMD ["python", "scientific_server.py"]
