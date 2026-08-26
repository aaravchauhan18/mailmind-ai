package ai.mailmind.api;
import ai.mailmind.domain.*; import jakarta.validation.constraints.*; import java.time.Instant; import java.util.*;

public final class ApiModels {
 private ApiModels() {}
 public record ImportEmail(@NotBlank String providerId, String threadId, @NotBlank String sender, String recipients, String subject, @NotBlank String body, String html, Instant receivedAt) { public ImportEmail(String providerId,String threadId,String sender,String recipients,String subject,String body,Instant receivedAt){this(providerId,threadId,sender,recipients,subject,body,null,receivedAt);} }
 public record EmailView(UUID id, String threadId, String sender, String subject, Instant receivedAt, Priority priority, EmailStatus status, String summary, String preview, String body) { public EmailView(UUID id, String threadId, String sender, String subject, Instant receivedAt, Priority priority, EmailStatus status, String summary, String preview){this(id,threadId,sender,subject,receivedAt,priority,status,summary,preview,preview);} }
 public record TaskView(UUID id, String title, Instant dueAt, boolean completed, UUID emailId, String emailSubject) {}
 public record EventView(UUID id, String title, Instant startsAt, Instant endsAt, String location) {}
 public record Analysis(String summary, Priority priority, List<String> actions, List<EventView> events) {}
 public record ReplyRequest(@NotBlank String instruction) {}
 public record Reply(String text) {}
 public record GmailAttachment(@NotBlank String name, String contentType, @NotBlank String data) {}
 public record GmailComposeRequest(@NotBlank String body, List<GmailAttachment> attachments) {}
 public record GmailWriteResult(String id, String threadId) {}
 public record IncomingAttachment(String id, String name, String contentType, long size) {}
 public record Digest(long urgent, long important, long fyi, List<TaskView> pendingTasks, List<String> highlights) {}
 public record SearchResult(List<EmailView> results) {}
 public record Profile(String email, String displayName, String initials, String provider) {}
}
