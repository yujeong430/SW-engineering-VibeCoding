package com.grouppay.domain.auth.controller;

import com.grouppay.domain.auth.dto.request.AuthRequest;
import com.grouppay.domain.auth.dto.response.AuthResponse;
import com.grouppay.domain.auth.service.AuthService;
import com.grouppay.global.api.CommonResponse;
import com.grouppay.global.api.code.SuccessCode;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/{uuid}/auth")
    public ResponseEntity<CommonResponse<AuthResponse>> authenticate(
            @PathVariable String uuid,
            @RequestBody @Valid AuthRequest request,
            HttpSession session) {
        AuthResponse response = authService.authenticate(uuid, request, session);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }
}
