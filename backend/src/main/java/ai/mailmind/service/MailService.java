package ai.mailmind.service;
import ai.mailmind.api.ApiModels.*; import ai.mailmind.data.*; import ai.mailmind.domain.*; import jakarta.transaction.Transactional; import org.springframework.stereotype.Service; import java.time.*; import java.util.*; import java.util.stream.*;
@Service public class MailService {
 private final EmailRepository emails; private final TaskRepository tasks; private final AnalysisService ai; private final OpenRouterReplyService replies;
 public MailService(EmailRepository e, TaskRepository t, AnalysisService a,OpenRouterReplyService r){emails=e;tasks=t;ai=a;replies=r;}
 @Transactional public EmailView ingest(User user, ImportEmail in){
  var existing=emails.findByUserIdAndProviderId(user.id,in.providerId()); if(existing.isPresent()){var saved=existing.get();saved.body=in.body();saved.htmlBody=in.html();saved.summary=ai.summary(in.subject(),in.body());saved.priority=ai.priority(in.subject()+" "+in.body());return view(saved);}
  Email e=new Email();e.user=user;e.providerId=in.providerId();e.threadId=in.threadId();e.sender=in.sender();e.recipients=in.recipients();e.subject=in.subject();e.body=in.body();e.htmlBody=in.html();e.receivedAt=Optional.ofNullable(in.receivedAt()).orElse(Instant.now());e.priority=ai.priority(e.subject+" "+e.body);e.summary=ai.summary(e.subject,e.body);e=emails.save(e);
  return view(e);
 }
 public List<EmailView> inbox(User u){return recent(u).stream().map(this::view).toList();}
 @Transactional public Analysis analyze(User u, UUID id){Email e=emails.findById(id).filter(x->x.user.id.equals(u.id)).orElseThrow(()->new NoSuchElementException("Email not found"));var actions=ai.actions(e.body);var created=actions.stream().map(a->tasks.save(new Task(u,e,a))).toList();return new Analysis(e.summary,e.priority,actions,List.of());}
 public Reply reply(User u,UUID id,String instruction){Email e=emails.findById(id).filter(x->x.user.id.equals(u.id)).orElseThrow(()->new NoSuchElementException("Email not found"));String name=(u.displayName==null||u.displayName.isBlank())?u.email:u.displayName;return new Reply(replies.draft(e,instruction,u.tone.name(),name));}
 public Email email(User u,UUID id){return emails.findById(id).filter(x->x.user.id.equals(u.id)).orElseThrow(()->new NoSuchElementException("Email not found"));}
 public String body(User u,UUID id){return email(u,id).body;}
 public String html(User u,UUID id){return email(u,id).htmlBody;}
 @Transactional public EmailView aiSummary(User u,UUID id){Email e=emails.findById(id).filter(x->x.user.id.equals(u.id)).orElseThrow(()->new NoSuchElementException("Email not found"));e.summary=replies.summarize(e);return view(e);}
 public String thread(User u,String threadId){return emails.findByUserIdAndThreadIdOrderByReceivedAtAsc(u.id,threadId).stream().map(e->e.summary).collect(Collectors.joining("\n• ","• ",""));}
 public Digest digest(User u){var all=recent(u);var counts=all.stream().collect(Collectors.groupingBy(e->e.priority,Collectors.counting()));return new Digest(counts.getOrDefault(Priority.URGENT,0L),counts.getOrDefault(Priority.IMPORTANT,0L),counts.getOrDefault(Priority.FYI,0L),tasks.findByUserIdAndCompletedFalse(u.id).stream().map(this::taskView).toList(),all.stream().filter(e->e.priority!=Priority.FYI).limit(5).map(e->e.summary).toList());}
 public SearchResult search(User u,String q){var words=Arrays.stream(q.toLowerCase().split("\\s+")).filter(w->w.length()>2).toList();var r=emails.findByUserIdOrderByReceivedAtDesc(u.id).stream().filter(e->{var h=(e.subject+" "+e.body+" "+e.summary).toLowerCase();return words.stream().anyMatch(h::contains);}).map(this::view).toList();return new SearchResult(r);}
 public List<TaskView> tasks(User u){return tasks.findByUserIdAndCompletedFalse(u.id).stream().map(this::taskView).toList();}
 public List<TaskView> closedTasks(User u){return tasks.findByUserIdAndCompletedTrue(u.id).stream().map(this::taskView).toList();}
 @Transactional public List<TaskView> generateTasks(User u){var existing=tasks.findByUserIdAndCompletedFalse(u.id);tasks.deleteAll(existing);var inbox=emails.findByUserIdAndStatus(u.id,EmailStatus.INBOX);var sources=inbox.stream().collect(Collectors.toMap(e->e.providerId,e->e));for(var item:replies.extractTasksWithSources(inbox)){Email source=sources.get(item.sourceId());if(source!=null)tasks.save(new Task(u,source,item.title()));}return tasks(u);}
 @Transactional public void complete(User u,UUID id){Task t=tasks.findById(id).filter(x->x.user.id.equals(u.id)).orElseThrow(()->new NoSuchElementException("Task not found"));t.completed=true;}
 @Transactional public void deleteClosed(User u,UUID id){Task t=tasks.findById(id).filter(x->x.user.id.equals(u.id)&&x.completed).orElseThrow(()->new NoSuchElementException("Closed task not found"));tasks.delete(t);}
 @Transactional public void deleteAllClosed(User u){tasks.deleteAll(tasks.findByUserIdAndCompletedTrue(u.id));}
 private TaskView taskView(Task task){return new TaskView(task.id,task.title,task.dueAt,task.completed,task.email==null?null:task.email.id,task.email==null?null:task.email.subject);}
 private List<Email> recent(User user){return emails.findByUserIdAndReceivedAtAfterOrderByReceivedAtDesc(user.id,Instant.now().minus(Duration.ofDays(7)));}
 private EmailView view(Email e){String preview=e.body==null?"":e.body.replace("\r\n","\n").replace("\r","\n").replaceAll("[ \\t]+"," ").replaceAll("\\n{3,}","\n\n").trim();if(preview.length()>260)preview=preview.substring(0,257)+"...";return new EmailView(e.id,e.threadId,e.sender,e.subject,e.receivedAt,e.priority,e.status,e.summary,preview);}
}
