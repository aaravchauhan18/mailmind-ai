package ai.mailmind.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name="users")
public class User {
  @Id public UUID id = UUID.randomUUID();
  @Column(nullable=false, unique=true) public String email;
  public String displayName;
  @Enumerated(EnumType.STRING) @Column(nullable=false) public Tone tone = Tone.PROFESSIONAL;
  @Column(nullable=false) public String timezone = "UTC";
  @Column(nullable=false) public Instant createdAt = Instant.now();
  protected User() {}
  public User(String email, String name) { this.email=email; this.displayName=name; }
}
