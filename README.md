# Speech-to-Text Application

Full-stack Speech-to-Text MVP built with Java Spring Boot and React.

## MVP Features

- User registration and login with JWT authentication
- Audio file upload
- Browser microphone recording
- Speech-to-text conversion endpoint
- Transcript display
- Saved transcript history
- Transcript download as `.txt`

Advanced features such as real-time transcription, speaker identification, summaries, sentiment analysis, and translation are intentionally not included.

## Project Structure

```text
backend/   Spring Boot REST API
frontend/  React + Vite client
```

## Backend

Requirements:

- Java 17+
- Maven

Run:

```bash
cd backend
mvn spring-boot:run
```

The API runs at `http://localhost:8080`.

By default the app uses a local H2 database file at `backend/data/sttapp` and stores audio files in `backend/uploads`.

Useful environment variables:

```bash
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=http://localhost:5173
DATABASE_URL=jdbc:postgresql://localhost:5432/sttapp
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_DRIVER=org.postgresql.Driver
UPLOAD_DIR=uploads
```

## Frontend

Requirements:

- Node.js
- npm

Run:

```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

To point the frontend at a different backend:

```bash
VITE_API_URL=http://localhost:8080
```

## Speech API Integration

The current implementation uses `DemoSpeechRecognitionService`, which returns a placeholder transcript so the full MVP can be tested without cloud credentials.

To connect a real provider, create another implementation of:

```java
com.sttapp.service.SpeechRecognitionService
```

and replace `DemoSpeechRecognitionService` with Google Speech-to-Text, Azure Speech Services, Deepgram, AssemblyAI, or another provider.

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/speech/upload` | Upload audio file |
| POST | `/api/speech/record` | Upload recorded audio |
| GET | `/api/speech/history` | Get transcript history |
| GET | `/api/speech/{id}` | Get one transcript |
| GET | `/api/speech/{id}/download` | Download transcript text |
