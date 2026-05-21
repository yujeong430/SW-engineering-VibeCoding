package com.grouppay.domain.auth.service;

import com.grouppay.domain.auth.dto.request.AuthRequest;
import com.grouppay.domain.auth.dto.response.AuthResponse;
import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.service.GroupService;
import com.grouppay.global.api.code.ErrorCode;
import com.grouppay.global.exception.BusinessException;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private GroupService groupService;

    @Mock
    private BCryptPasswordEncoder passwordEncoder;

    @Mock
    private HttpSession session;

    @Test
    @DisplayName("PIN 인증 성공 - 세션에 방장 권한 저장")
    void authenticate_success() {
        // given
        String uuid = "test-uuid";
        Group group = Group.builder().uuid(uuid).name("제주도 여행").pinHash("$hashed$").build();
        AuthRequest request = mockAuthRequest("1234");

        given(groupService.findGroupByUuid(uuid)).willReturn(group);
        given(passwordEncoder.matches("1234", "$hashed$")).willReturn(true);

        // when
        AuthResponse response = authService.authenticate(uuid, request, session);

        // then
        assertThat(response.isHost()).isTrue();
        verify(session).setAttribute("HOST_" + uuid, true);
    }

    @Test
    @DisplayName("PIN 인증 실패 - PIN 불일치")
    void authenticate_pinMismatch() {
        // given
        String uuid = "test-uuid";
        Group group = Group.builder().uuid(uuid).name("제주도 여행").pinHash("$hashed$").build();
        AuthRequest request = mockAuthRequest("9999");

        given(groupService.findGroupByUuid(uuid)).willReturn(group);
        given(passwordEncoder.matches("9999", "$hashed$")).willReturn(false);

        // when & then
        assertThatThrownBy(() -> authService.authenticate(uuid, request, session))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.AUTH_PIN_MISMATCH));
    }

    @Test
    @DisplayName("PIN 인증 실패 - 존재하지 않는 그룹")
    void authenticate_groupNotFound() {
        // given
        String uuid = "invalid-uuid";
        AuthRequest request = mockAuthRequest("1234");

        given(groupService.findGroupByUuid(uuid))
                .willThrow(new BusinessException(ErrorCode.GROUP_NOT_FOUND));

        // when & then
        assertThatThrownBy(() -> authService.authenticate(uuid, request, session))
                .isInstanceOf(BusinessException.class)
                .satisfies(e -> assertThat(((BusinessException) e).getErrorCode())
                        .isEqualTo(ErrorCode.GROUP_NOT_FOUND));
    }

    private AuthRequest mockAuthRequest(String pin) {
        try {
            AuthRequest request = new AuthRequest();
            var field = AuthRequest.class.getDeclaredField("pin");
            field.setAccessible(true);
            field.set(request, pin);
            return request;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
