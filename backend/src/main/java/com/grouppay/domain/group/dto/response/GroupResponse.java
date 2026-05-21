package com.grouppay.domain.group.dto.response;

import com.grouppay.domain.group.entity.Group;
import com.grouppay.domain.group.entity.GroupStatus;
import lombok.Getter;

@Getter
public class GroupResponse {

    private final String uuid;
    private final String name;
    private final GroupStatus status;

    public GroupResponse(Group group) {
        this.uuid = group.getUuid();
        this.name = group.getName();
        this.status = group.getStatus();
    }
}
