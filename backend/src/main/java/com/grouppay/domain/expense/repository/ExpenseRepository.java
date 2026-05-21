package com.grouppay.domain.expense.repository;

import com.grouppay.domain.expense.entity.Expense;
import com.grouppay.domain.group.entity.Group;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByGroup(Group group);

    boolean existsByGroupAndPayer_Id(Group group, Long memberId);
}
