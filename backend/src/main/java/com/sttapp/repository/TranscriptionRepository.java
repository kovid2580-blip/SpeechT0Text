package com.sttapp.repository;

import com.sttapp.model.Transcription;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranscriptionRepository extends JpaRepository<Transcription, Long> {
    List<Transcription> findByUserEmailOrderByCreatedAtDesc(String email);

    Optional<Transcription> findByIdAndUserEmail(Long id, String email);
}
