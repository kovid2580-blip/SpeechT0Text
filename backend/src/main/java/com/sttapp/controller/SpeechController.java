package com.sttapp.controller;

import com.sttapp.dto.TranscriptionResponse;
import com.sttapp.service.TranscriptionService;
import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/speech")
public class SpeechController {
    private final TranscriptionService transcriptionService;

    public SpeechController(TranscriptionService transcriptionService) {
        this.transcriptionService = transcriptionService;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TranscriptionResponse upload(@RequestPart("file") MultipartFile file, Principal principal) throws Exception {
        return transcriptionService.transcribe(file, principal.getName());
    }

    @PostMapping(value = "/record", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public TranscriptionResponse record(
            @RequestPart("file") MultipartFile file,
            @RequestPart(value = "transcript", required = false) String transcript,
            Principal principal
    ) throws Exception {
        return transcriptionService.transcribe(file, principal.getName(), transcript);
    }

    @GetMapping("/history")
    public List<TranscriptionResponse> history(Principal principal) {
        return transcriptionService.history(principal.getName());
    }

    @GetMapping("/{id}")
    public TranscriptionResponse findOne(@PathVariable Long id, Principal principal) {
        return transcriptionService.findOne(id, principal.getName());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Principal principal) {
        transcriptionService.delete(id, principal.getName());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> download(@PathVariable Long id, Principal principal) {
        TranscriptionResponse transcription = transcriptionService.findOne(id, principal.getName());
        byte[] body = transcription.transcript().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename("transcript-" + id + ".txt")
                        .build()
                        .toString())
                .contentType(MediaType.TEXT_PLAIN)
                .body(body);
    }
}
