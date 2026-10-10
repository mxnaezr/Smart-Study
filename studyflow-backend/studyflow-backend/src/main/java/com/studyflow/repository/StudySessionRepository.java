package com.studyflow.repository;

import com.studyflow.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {

    @EntityGraph(attributePaths = "subject")
    List<StudySession> findByUserId(Long userId);

    List<StudySession> findBySubjectId(Long subjectId);
}