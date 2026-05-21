package com.grouppay.domain.group.controller;

import com.grouppay.domain.group.dto.request.CreateGroupRequest;
import com.grouppay.domain.group.dto.request.UpdateGroupRequest;
import com.grouppay.domain.group.dto.response.GroupDetailResponse;
import com.grouppay.domain.group.dto.response.GroupResponse;
import com.grouppay.domain.group.service.GroupService;
import com.grouppay.global.api.CommonResponse;
import com.grouppay.global.api.code.SuccessCode;
import com.grouppay.global.auth.HostSessionManager;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @PostMapping
    public ResponseEntity<CommonResponse<GroupResponse>> createGroup(
            @RequestBody @Valid CreateGroupRequest request) {
        GroupResponse response = groupService.createGroup(request);
        return ResponseEntity.status(201)
                .body(CommonResponse.success(SuccessCode.CREATED, response));
    }

    @GetMapping("/{uuid}")
    public ResponseEntity<CommonResponse<GroupDetailResponse>> getGroup(
            @PathVariable String uuid) {
        GroupDetailResponse response = groupService.getGroup(uuid);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    @PatchMapping("/{uuid}")
    public ResponseEntity<CommonResponse<GroupResponse>> updateGroup(
            @PathVariable String uuid,
            @RequestBody @Valid UpdateGroupRequest request,
            HttpSession session) {
        HostSessionManager.validateHost(session, uuid);
        GroupResponse response = groupService.updateGroup(uuid, request);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    @DeleteMapping("/{uuid}")
    public ResponseEntity<CommonResponse<Void>> deleteGroup(
            @PathVariable String uuid,
            HttpSession session) {
        HostSessionManager.validateHost(session, uuid);
        groupService.deleteGroup(uuid);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK));
    }
}
