package com.sttapp.service;

import com.sttapp.dto.TranscriptionResponse;
import com.sttapp.model.Transcription;
import com.sttapp.model.User;
import com.sttapp.repository.TranscriptionRepository;
import com.sttapp.repository.UserRepository;
import java.io.IOException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class TranscriptionService {
    private final FileStorageService fileStorageService;
    private final SpeechRecognitionService speechRecognitionService;
    private final TranscriptionRepository transcriptionRepository;
    private final UserRepository userRepository;

    public TranscriptionService(
            FileStorageService fileStorageService,
            SpeechRecognitionService speechRecognitionService,
            TranscriptionRepository transcriptionRepository,
            UserRepository userRepository
    ) {
        this.fileStorageService = fileStorageService;
        this.speechRecognitionService = speechRecognitionService;
        this.transcriptionRepository = transcriptionRepository;
        this.userRepository = userRepository;
    }

    public TranscriptionResponse transcribe(MultipartFile file, String email) throws IOException {
        return transcribe(file, email, null);
    }

    public TranscriptionResponse transcribe(MultipartFile file, String email, String providedTranscript) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        FileStorageService.StoredFile storedFile = fileStorageService.store(file);
        String transcript = providedTranscript == null || providedTranscript.isBlank()
                ? speechRecognitionService.transcribe(storedFile.path(), storedFile.originalName())
                : providedTranscript.trim();

        Transcription transcription = new Transcription();
        transcription.setUser(user);
        transcription.setAudioFile(storedFile.originalName());
        transcription.setTranscript(transcript);
        return toResponse(transcriptionRepository.save(transcription));
    }

    public List<TranscriptionResponse> history(String email) {
        return transcriptionRepository.findByUserEmailOrderByCreatedAtDesc(email)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public TranscriptionResponse findOne(Long id, String email) {
        return transcriptionRepository.findByIdAndUserEmail(id, email)
                .map(this::toResponse)
                .orElseThrow(() -> new IllegalArgumentException("Transcript not found"));
    }

    public void delete(Long id, String email) {
        Transcription transcription = transcriptionRepository.findByIdAndUserEmail(id, email)
                .orElseThrow(() -> new IllegalArgumentException("Transcript not found"));
        transcriptionRepository.delete(transcription);
    }

    private TranscriptionResponse toResponse(Transcription transcription) {
        return new TranscriptionResponse(
                transcription.getId(),
                transcription.getAudioFile(),
                transcription.getTranscript(),
                transcription.getCreatedAt()
        );
    }
}
