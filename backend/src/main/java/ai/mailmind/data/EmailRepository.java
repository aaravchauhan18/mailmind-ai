package ai.mailmind.data;
import ai.mailmind.domain.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface EmailRepository extends JpaRepository<Email, UUID> {
 List<Email> findByUserIdOrderByReceivedAtDesc(UUID userId);
 List<Email> findByUserIdAndReceivedAtAfterOrderByReceivedAtDesc(UUID userId, java.time.Instant after);
 List<Email> findByUserIdAndThreadIdOrderByReceivedAtAsc(UUID userId, String threadId);
 List<Email> findByUserIdAndStatus(UUID userId, EmailStatus status);
 Optional<Email> findByUserIdAndProviderId(UUID userId, String providerId);
}
