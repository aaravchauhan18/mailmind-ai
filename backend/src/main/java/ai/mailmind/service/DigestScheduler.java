package ai.mailmind.service;
import ai.mailmind.data.UserRepository; import org.springframework.scheduling.annotation.Scheduled; import org.springframework.stereotype.Component;
/** Digest delivery is deliberately separated from generation: connect an email provider here after configuring verified sending credentials. */
@Component public class DigestScheduler {
 private final UserRepository users; private final MailService mail;
 public DigestScheduler(UserRepository users,MailService mail){this.users=users;this.mail=mail;}
 @Scheduled(cron="${app.digest-cron}") public void generateDailyDigests(){users.findAll().forEach(mail::digest);}
}
