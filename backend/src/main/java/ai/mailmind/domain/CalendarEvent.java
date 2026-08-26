package ai.mailmind.domain;
import jakarta.persistence.*;
import java.time.Instant; import java.util.UUID;
@Entity @Table(name="calendar_events") public class CalendarEvent {
 @Id public UUID id=UUID.randomUUID(); @ManyToOne(optional=false) @JoinColumn(name="user_id") public User user;
 @ManyToOne @JoinColumn(name="email_id") public Email email; @Column(nullable=false) public String title; @Column(nullable=false) public Instant startsAt; public Instant endsAt; public String location; public String externalId; protected CalendarEvent() {}
}
