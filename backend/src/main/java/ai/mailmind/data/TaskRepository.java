package ai.mailmind.data;
import ai.mailmind.domain.Task; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface TaskRepository extends JpaRepository<Task, UUID> { List<Task> findByUserIdAndCompletedFalse(UUID userId); List<Task> findByUserIdAndCompletedTrue(UUID userId); }
