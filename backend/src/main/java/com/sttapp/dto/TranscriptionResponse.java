package com.sttapp.dto;

import java.time.Instant;

public record TranscriptionResponse(
        Long id,
        String audioFile,
        String transcript,
        Instant createdAt
) {
}
