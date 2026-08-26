package ai.mailmind.service;
import ai.mailmind.data.UserRepository; import ai.mailmind.domain.User; import org.springframework.security.core.Authentication; import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken; import org.springframework.security.oauth2.core.oidc.user.OidcUser; import org.springframework.stereotype.Service;
@Service public class IdentityService {
 private final UserRepository users; public IdentityService(UserRepository users){this.users=users;}
 public User user(String email){ return users.findByEmail(email).orElseGet(()->users.save(new User(email, email.substring(0,email.indexOf('@'))))); }
 public User user(Authentication authentication){if(authentication instanceof OAuth2AuthenticationToken token && token.getPrincipal() instanceof OidcUser oidc){String email=oidc.getEmail();if(email!=null)return users.findByEmail(email).orElseGet(()->users.save(new User(email,oidc.getFullName())));}return user("demo@mailmind.local");}
}
