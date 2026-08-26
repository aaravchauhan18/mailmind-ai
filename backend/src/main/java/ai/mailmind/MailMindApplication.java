package ai.mailmind;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MailMindApplication {
  public static void main(String[] args) { SpringApplication.run(MailMindApplication.class, args); }
}
