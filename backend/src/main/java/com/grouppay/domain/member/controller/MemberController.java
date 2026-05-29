package com.grouppay.domain.member.controller;

import com.grouppay.domain.member.dto.request.AddMemberRequest;
import com.grouppay.domain.member.dto.request.UpdateAccountRequest;
import com.grouppay.domain.member.dto.response.MemberResponse;
import com.grouppay.domain.member.service.MemberService;
import com.grouppay.global.api.CommonResponse;
import com.grouppay.global.api.code.SuccessCode;
import com.grouppay.global.auth.HostSessionManager;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/groups/{uuid}/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    @PostMapping
    public ResponseEntity<CommonResponse<MemberResponse>> addMember(
            @PathVariable String uuid,
            @RequestBody @Valid AddMemberRequest request,
            HttpSession session) {
        HostSessionManager.validateHost(session, uuid);
        MemberResponse response = memberService.addMember(uuid, request);
        return ResponseEntity.status(201)
                .body(CommonResponse.success(SuccessCode.CREATED, response));
    }

    @GetMapping("/{memberId}")
    public ResponseEntity<CommonResponse<MemberResponse>> getMember(
            @PathVariable String uuid,
            @PathVariable Long memberId) {
        MemberResponse response = memberService.getMember(uuid, memberId);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    @PatchMapping("/{memberId}")
    public ResponseEntity<CommonResponse<MemberResponse>> updateAccount(
            @PathVariable String uuid,
            @PathVariable Long memberId,
            @RequestBody @Valid UpdateAccountRequest request) {
        MemberResponse response = memberService.updateAccount(uuid, memberId, request);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<CommonResponse<Void>> removeMember(
            @PathVariable String uuid,
            @PathVariable Long memberId,
            HttpSession session) {
        HostSessionManager.validateHost(session, uuid);
        memberService.removeMember(uuid, memberId);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK));
    }
}
