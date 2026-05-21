package com.grouppay.domain.member.dto.response;

import com.grouppay.domain.member.entity.Member;
import lombok.Getter;

@Getter
public class MemberResponse {

    private final Long id;
    private final String name;
    private final String bankName;
    private final String accountNo;

    public MemberResponse(Member member) {
        this.id = member.getId();
        this.name = member.getName();
        this.bankName = member.getBankName();
        this.accountNo = member.getAccountNo();
    }
}
