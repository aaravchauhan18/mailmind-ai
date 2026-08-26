package ai.mailmind.service;
import ai.mailmind.domain.Priority; import org.springframework.stereotype.Service; import java.util.*; import java.util.regex.*;
@Service public class AnalysisService {
 private static final Pattern ACTION=Pattern.compile("(?im)^(?:[-*•]\\s*)?(please |kindly )?(.{4,160}?(?:by|before|today|tomorrow|thursday|friday).{0,50})$");
 public Priority priority(String text){String v=text.toLowerCase(Locale.ROOT);if(v.matches(".*\\b(urgent|asap|immediately|overdue|final notice|action required)\\b.*"))return Priority.URGENT;if(v.matches(".*\\b(interview|meeting|invoice|payment|due|review|deadline)\\b.*"))return Priority.IMPORTANT;return Priority.FYI;}
 public String summary(String subject,String body){String normalized=body.replaceAll("\\s+"," ").trim(); if(normalized.length()>280) normalized=normalized.substring(0,277)+"..."; return (subject==null||subject.isBlank()?"":subject+": ")+normalized;}
 public List<String> actions(String body){var out=new ArrayList<String>();var m=ACTION.matcher(body);while(m.find()&&out.size()<5)out.add(m.group(2).trim());return out;}
 public String reply(String sender,String subject,String instruction,String tone){String greeting=tone.equals("CASUAL")?"Hi":tone.equals("FRIENDLY")?"Hello":"Dear";String closing=tone.equals("CASUAL")?"Thanks!":"Best regards,";return greeting+" "+sender.replaceAll("<.*","")+",\n\n"+instruction.trim()+"\n\n"+closing+"\n";}
}
