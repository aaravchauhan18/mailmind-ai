package ai.mailmind.config;
import org.springframework.context.annotation.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.*;
import java.util.List;

@Configuration @Profile("!google") public class SecurityConfig {
 @Value("${app.cors-origin}") String corsOrigin;
 @Bean SecurityFilterChain security(HttpSecurity http) throws Exception {
  return http.csrf(csrf->csrf.disable()).cors(c->{}).authorizeHttpRequests(a->a.requestMatchers("/actuator/health","/api/**").permitAll().anyRequest().authenticated()).build();
 }
 @Bean CorsConfigurationSource corsConfigurationSource() { var c=new CorsConfiguration(); c.setAllowedOrigins(List.of(corsOrigin)); c.setAllowedMethods(List.of("GET","POST","PATCH","DELETE","OPTIONS")); c.setAllowedHeaders(List.of("*")); var s=new UrlBasedCorsConfigurationSource();s.registerCorsConfiguration("/**",c);return s; }
}
