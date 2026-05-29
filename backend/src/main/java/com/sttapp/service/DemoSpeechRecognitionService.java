package com.sttapp.service;

import java.nio.file.Path;
import org.springframework.stereotype.Service;

@Service
public class DemoSpeechRecognitionService implements SpeechRecognitionService {
    @Override
    public String transcribe(Path audioPath, String originalFileName) {
        return "Demo transcript for " + originalFileName + ". "
                + "Connect Google Speech-to-Text, Azure Speech Services, Deepgram, or AssemblyAI "
                + "inside SpeechRecognitionService to return real transcript text.";
    }
}
