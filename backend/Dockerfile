FROM python:3.11-slim

WORKDIR /app

RUN mkdir -p /app/backend

COPY requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

COPY . /app/backend

EXPOSE 4000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "4000"]
