FROM node:20-bookworm

WORKDIR /app

ENV NODE_ENV=production
ENV LAMP_JOB_DIR=/data/lamp-jobs
ENV PYTHON_BIN=python3

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip python3-venv \
  && rm -rf /var/lib/apt/lists/*

COPY requirements-mvp.txt ./
RUN python3 -m pip install --break-system-packages --no-cache-dir -r requirements-mvp.txt

RUN python3 - <<'PY'
from rembg import new_session
new_session("isnet-general-use")
PY

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN mkdir -p /data/lamp-jobs

EXPOSE 3000

CMD ["npm", "start"]
