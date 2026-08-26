package ai.mailmind.domain;
import jakarta.persistence.*;
import java.time.Instant; import java.util.UUID;
@Entity @Table(name="tasks") public class Task {
 @Id public UUID id=UUID.randomUUID(); @ManyToOne(optional=false) @JoinColumn(name="user_id") public User user;
 @ManyToOne @JoinColumn(name="email_id") public Email email; @Column(nullable=false) public String title; public Instant dueAt; @Column(nullable=false) public boolean completed; @Column(nullable=false) public Instant createdAt=Instant.now(); protected Task() {}
 public Task(User u, Email e, String title){this.user=u;this.email=e;this.title=title;}
}
