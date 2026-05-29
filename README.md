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

| GET | `/api/speech/{id}/download` | Download transcript text |
