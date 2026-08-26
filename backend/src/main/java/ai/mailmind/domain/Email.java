package ai.mailmind.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="emails", uniqueConstraints=@UniqueConstraint(columnNames={"user_id","provider_id"}))
public class Email {
  @Id public UUID id = UUID.randomUUID();
  @ManyToOne(optional=false) @JoinColumn(name="user_id") public User user;
  @Column(name="provider_id", nullable=false) public String providerId;
  public String threadId;
  @Column(nullable=false) public String sender;
  @Column(columnDefinition="text") public String recipients;
  public String subject;
  @Column(nullable=false, columnDefinition="text") public String body;
  @Column(name="html_body", columnDefinition="text") public String htmlBody;
  @Column(nullable=false) public Instant receivedAt;
  @Enumerated(EnumType.STRING) @Column(nullable=false) public Priority priority = Priority.IMPORTANT;
  @Enumerated(EnumType.STRING) @Column(nullable=false) public EmailStatus status = EmailStatus.INBOX;
  @Column(columnDefinition="text") public String summary;
  @Column(columnDefinition="text") public String embedding;
  public Email() {}
}
