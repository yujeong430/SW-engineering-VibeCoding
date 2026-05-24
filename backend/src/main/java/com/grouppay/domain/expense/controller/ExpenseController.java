package com.grouppay.domain.expense.controller;

import com.grouppay.domain.expense.dto.request.CreateExpenseRequest;
import com.grouppay.domain.expense.dto.request.UpdateExpenseRequest;
import com.grouppay.domain.expense.dto.response.ExpenseListResponse;
import com.grouppay.domain.expense.dto.response.ExpenseResponse;
import com.grouppay.domain.expense.service.ExpenseService;
import com.grouppay.global.api.CommonResponse;
import com.grouppay.global.api.code.SuccessCode;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/groups/{uuid}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<CommonResponse<ExpenseResponse>> createExpense(
            @PathVariable String uuid,
            @RequestBody @Valid CreateExpenseRequest request) {
        ExpenseResponse response = expenseService.createExpense(uuid, request);
        return ResponseEntity.status(201)
                .body(CommonResponse.success(SuccessCode.CREATED, response));
    }

    @GetMapping
    public ResponseEntity<CommonResponse<ExpenseListResponse>> getExpenses(
            @PathVariable String uuid) {
        ExpenseListResponse response = expenseService.getExpenses(uuid);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    @PatchMapping("/{expenseId}")
    public ResponseEntity<CommonResponse<ExpenseResponse>> updateExpense(
            @PathVariable String uuid,
            @PathVariable Long expenseId,
            @RequestBody @Valid UpdateExpenseRequest request) {
        ExpenseResponse response = expenseService.updateExpense(uuid, expenseId, request);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK, response));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<CommonResponse<Void>> deleteExpense(
            @PathVariable String uuid,
            @PathVariable Long expenseId) {
        expenseService.deleteExpense(uuid, expenseId);
        return ResponseEntity.ok(CommonResponse.success(SuccessCode.OK));
    }
}
