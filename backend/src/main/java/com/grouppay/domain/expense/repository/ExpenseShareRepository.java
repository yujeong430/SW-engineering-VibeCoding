package com.grouppay.domain.expense.repository;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.expense.entity.ExpenseShare;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseShareRepository extends JpaRepository<ExpenseShare, Long> {

    List<ExpenseShare> findByExpense(Expense expense);

    List<ExpenseShare> findByExpenseIn(List<Expense> expenses);

    void deleteByExpense(Expense expense);
}
