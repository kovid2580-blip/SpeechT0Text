package com.sttapp.service;

import java.nio.file.Path;

public interface SpeechRecognitionService {
    String transcribe(Path audioPath, String originalFileName);
}
