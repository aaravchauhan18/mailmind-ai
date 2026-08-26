package ai.mailmind.api;
import ai.mailmind.domain.User; import ai.mailmind.service.*; import org.springframework.context.annotation.Profile; import org.springframework.http.*; import org.springframework.security.core.context.SecurityContextHolder; import org.springframework.web.bind.annotation.*; import java.util.*;
@RestController @RequestMapping("/api/gmail") @Profile("google") public class GmailController {
 private final GmailSyncService gmail; private final IdentityService identities; public GmailController(GmailSyncService g,IdentityService i){gmail=g;identities=i;}
 @PostMapping("/sync") public Map<String,Integer> sync(){var auth=SecurityContextHolder.getContext().getAuthentication();User user=identities.user(auth);return Map.of("imported",gmail.sync(auth,user));}
}
