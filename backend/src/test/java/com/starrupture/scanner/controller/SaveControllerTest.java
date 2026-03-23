package com.starrupture.scanner.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.starrupture.scanner.dto.SaveSessionDto;
import com.starrupture.scanner.entity.SaveSession;
import com.starrupture.scanner.service.EntityService;
import com.starrupture.scanner.service.SaveParserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.bean.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SaveController.class)
class SaveControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SaveParserService saveParserService;

    @MockBean
    private EntityService entityService;

    @Test
    @DisplayName("POST /api/saves - should upload .sav file successfully")
    void shouldUploadSavFile() throws Exception {
        UUID sessionId = UUID.randomUUID();
        SaveSession session = SaveSession.builder()
                .id(sessionId)
                .filename("test.sav")
                .sessionName("Test Session")
                .playtime(1234.5)
                .uploadAt(LocalDateTime.now())
                .build();

        SaveSessionDto dto = SaveSessionDto.builder()
                .id(sessionId.toString())
                .filename("test.sav")
                .sessionName("Test Session")
                .playtime(1234.5)
                .entityCount(0)
                .build();

        when(saveParserService.parseSavFile(any())).thenReturn(session);
        when(entityService.toSessionDto(any(SaveSession.class), anyInt())).thenReturn(dto);

        MockMultipartFile file = new MockMultipartFile(
                "file", "test.sav", "application/octet-stream", new byte[]{0, 1, 2, 3, 4});

        mockMvc.perform(multipart("/api/saves").file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(sessionId.toString()))
                .andExpect(jsonPath("$.filename").value("test.sav"))
                .andExpect(jsonPath("$.sessionName").value("Test Session"));
    }

    @Test
    @DisplayName("POST /api/saves - should reject non-.sav file")
    void shouldRejectNonSavFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", new byte[]{0, 1, 2, 3});

        mockMvc.perform(multipart("/api/saves").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/saves - should reject empty file")
    void shouldRejectEmptyFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.sav", "application/octet-stream", new byte[0]);

        mockMvc.perform(multipart("/api/saves").file(file))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/saves - should return list of sessions")
    void shouldReturnSessionList() throws Exception {
        SaveSessionDto dto1 = SaveSessionDto.builder()
                .id(UUID.randomUUID().toString())
                .filename("save1.sav")
                .sessionName("Session 1")
                .entityCount(42)
                .build();
        SaveSessionDto dto2 = SaveSessionDto.builder()
                .id(UUID.randomUUID().toString())
                .filename("save2.sav")
                .sessionName("Session 2")
                .entityCount(99)
                .build();

        when(entityService.getAllSessions()).thenReturn(List.of(dto1, dto2));

        mockMvc.perform(get("/api/saves"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].filename").value("save1.sav"))
                .andExpect(jsonPath("$[1].filename").value("save2.sav"));
    }

    @Test
    @DisplayName("GET /api/saves - should return empty list")
    void shouldReturnEmptyList() throws Exception {
        when(entityService.getAllSessions()).thenReturn(List.of());

        mockMvc.perform(get("/api/saves"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("DELETE /api/saves/{id} - should delete session")
    void shouldDeleteSession() throws Exception {
        UUID sessionId = UUID.randomUUID();
        doNothing().when(entityService).deleteSession(sessionId);

        mockMvc.perform(delete("/api/saves/" + sessionId))
                .andExpect(status().isNoContent());

        verify(entityService).deleteSession(sessionId);
    }

    @Test
    @DisplayName("DELETE /api/saves/{id} - should return 404 for unknown session")
    void shouldReturn404ForUnknownSession() throws Exception {
        UUID sessionId = UUID.randomUUID();
        doThrow(new NoSuchElementException("Session not found: " + sessionId))
                .when(entityService).deleteSession(sessionId);

        mockMvc.perform(delete("/api/saves/" + sessionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
