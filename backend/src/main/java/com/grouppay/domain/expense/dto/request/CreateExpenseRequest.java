package com.grouppay.domain.expense.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;

import java.util.List;

@Getter
public class CreateExpenseRequest {

    @NotBlank
    @Size(min = 1, max = 50)
    private String title;

    @Min(10)
    private int amount;

    private Long payerId;

    @NotEmpty
    private List<Long> shareMemberIds;
}
